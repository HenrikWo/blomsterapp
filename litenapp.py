import csv
import requests
from bs4 import BeautifulSoup
import time
import re
import os
import urllib.parse

def finn_neste_versjon(base_path, base_navn):
    """Finner neste tilgjengelige versjonsnummer"""
    versjon = 1
    while True:
        fil_navn = f"{base_navn}_{versjon}.csv"
        full_path = os.path.join(base_path, fil_navn)
        if not os.path.exists(full_path):
            return full_path, versjon
        versjon += 1

def hent_planteoverskrift(url, timeout=15):
    """Henter planteoverskrift fra norskflora.no"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'no-NO,no;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        print(f"      Henter side...")
        
        # Prøv opprinnelig URL først
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        print(f"      Status: {response.status_code}, URL: {response.url}")
        print(f"      HTML lengde: {len(response.content)} bytes")
        
        # Hvis side er suspekt liten, prøv alternativ URL
        if len(response.content) < 5000:
            parsed = urllib.parse.urlparse(url)
            query_params = urllib.parse.parse_qs(parsed.query)
            
            if 'sle' in query_params and 'art' in query_params:
                slekt = query_params['sle'][0].lower()
                art = query_params['art'][0].lower()
                alternativ_url = f"https://norskflora.no/{slekt}-{art}/"
                
                print(f"      Prøver alternativ URL: {alternativ_url}")
                response2 = requests.get(alternativ_url, headers=headers, timeout=timeout, allow_redirects=True)
                
                if response2.status_code == 200 and len(response2.content) > len(response.content):
                    print(f"      Alternativ ga mer innhold ({len(response2.content)} bytes)")
                    response = response2
        
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Metode 1: Finn planteoverskrift med class
        planteoverskrift = soup.find('h1', class_='planteoverskrift')
        if planteoverskrift:
            overskrift_tekst = planteoverskrift.get_text().strip()
            print(f"      ✅ Fant overskrift: '{overskrift_tekst}'")
            return overskrift_tekst
        
        # Metode 2: Finn h1 inne i overskriftsrad
        overskriftsrad = soup.find('div', class_='overskriftsrad')
        if overskriftsrad:
            h1_i_rad = overskriftsrad.find('h1')
            if h1_i_rad:
                overskrift_tekst = h1_i_rad.get_text().strip()
                print(f"      ✅ Fant h1 i overskriftsrad: '{overskrift_tekst}'")
                return overskrift_tekst
        
        # Metode 3: Finn alle h1 tagger
        alle_h1 = soup.find_all('h1')
        print(f"      Fant {len(alle_h1)} h1-tagger:")
        for h1 in alle_h1:
            tekst = h1.get_text().strip()
            classes = h1.get('class', [])
            print(f"        - '{tekst}' (class: {classes})")
            
            # Skip logo og andre ikke-plantenavn
            if tekst.lower() not in ['norskflora.no', 'meny', 'støtt norskflora.no'] and len(tekst) > 2:
                print(f"      ✅ Bruker første relevante h1: '{tekst}'")
                return tekst
        
        # Metode 4: Søk etter botanisk navn
        botnavn_link = soup.find('a', class_='botnavn')
        if botnavn_link:
            botanisk_navn = botnavn_link.get_text().strip()
            print(f"      Fant botanisk navn: '{botanisk_navn}'")
            return f"BOTANISK: {botanisk_navn}"
        
        # Metode 5: Fallback til title
        title_tag = soup.find('title')
        if title_tag:
            title_tekst = title_tag.get_text().strip()
            # Fjern norskflora.no suffix
            title_ren = title_tekst.replace(' - norskflora.no', '').strip()
            print(f"      ⚠️ Fallback til title: '{title_ren}'")
            return f"FALLBACK_TITLE: {title_ren}"
        
        print(f"      ❌ Ingen overskrift funnet")
        return "INGEN_OVERSKRIFT_FUNNET"
            
    except requests.exceptions.RequestException as e:
        return f"FEIL: {str(e)}"
    except Exception as e:
        return f"PARSE_FEIL: {str(e)}"

def sjekk_tittel_match(forventet_navn, planteoverskrift):
    """Sjekker om planteoverskriften matcher det forventede navnet"""
    if not planteoverskrift:
        return False, "Ingen overskrift funnet"
    
    if planteoverskrift.startswith('FEIL:') or planteoverskrift.startswith('PARSE_FEIL:'):
        return False, planteoverskrift
    
    if planteoverskrift.startswith('FALLBACK_TITLE:'):
        # Fjern prefiks og behandle som vanlig tittel
        side_tittel = planteoverskrift.replace('FALLBACK_TITLE:', '').strip()
        planteoverskrift = side_tittel
    
    if planteoverskrift.startswith('BOTANISK:'):
        # For botanisk navn, noter det men marker som mismatch
        return False, planteoverskrift
    
    # Sammenlign (case-insensitive)
    forventet_ren = forventet_navn.lower().strip()
    overskrift_ren = planteoverskrift.lower().strip()
    
    # Eksakt match
    if forventet_ren == overskrift_ren:
        return True, "Eksakt match"
    
    # Delvis match (navnet er i overskriften eller omvendt)
    if forventet_ren in overskrift_ren or overskrift_ren in forventet_ren:
        return True, f"Delvis match: '{planteoverskrift}'"
    
    return False, f"Mismatch: '{planteoverskrift}'"

def sjekk_csv_linker(csv_fil, url_kolonne='norskflora_url', navn_kolonne='Norsk navn'):
    """Sjekker alle linker i CSV-filen"""
    
    print(f"🔍 Sjekker linker i: {csv_fil}")
    print(f"📋 URL kolonne: {url_kolonne}")
    print(f"📋 Navn kolonne: {navn_kolonne}")
    print("=" * 60)
    
    # Les CSV
    with open(csv_fil, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"📊 Fant {len(rows)} rader")
    
    resultater = []
    feil_count = 0
    ok_count = 0
    
    for i, row in enumerate(rows, 1):
        url = row.get(url_kolonne, '').strip()
        navn = row.get(navn_kolonne, '').strip()
        
        if not url or not navn:
            print(f"[{i:3d}] HOPPER OVER: Mangler URL eller navn")
            continue
        
        print(f"[{i:3d}] Sjekker: {navn}")
        print(f"      URL: {url}")
        
        # Hent planteoverskrift fra siden
        planteoverskrift = hent_planteoverskrift(url)
        
        if planteoverskrift.startswith('FEIL:') or planteoverskrift.startswith('PARSE_FEIL:'):
            print(f"      ❌ {planteoverskrift}")
            feil_count += 1
            resultater.append({
                'rad': i,
                'navn': navn,
                'url': url,
                'status': 'FEIL',
                'planteoverskrift': planteoverskrift,
                'match': False,
                'beskrivelse': planteoverskrift
            })
        else:
            # Sjekk om overskriften matcher
            match, beskrivelse = sjekk_tittel_match(navn, planteoverskrift)
            
            if match:
                print(f"      ✅ {beskrivelse}")
                ok_count += 1
            else:
                print(f"      ⚠️  {beskrivelse}")
                feil_count += 1
            
            resultater.append({
                'rad': i,
                'navn': navn,
                'url': url,
                'status': 'OK' if match else 'MISMATCH',
                'planteoverskrift': planteoverskrift,
                'match': match,
                'beskrivelse': beskrivelse
            })
        
        # Pause mellom forespørsler
        time.sleep(0.5)
    
    print("\n" + "=" * 60)
    print(f"📊 SAMMENDRAG:")
    print(f"✅ OK: {ok_count}")
    print(f"❌ Feil: {feil_count}")
    print(f"📈 Totalt: {len([r for r in resultater if r['status'] != 'HOPPER OVER'])}")
    
    return resultater

def lagre_rapport(resultater, output_fil='link_rapport.csv'):
    """Lagrer resultatene til en rapport-fil"""
    
    print(f"\n📁 Lagrer rapport til: {output_fil}")
    
    with open(output_fil, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'rad', 'navn', 'url', 'status', 'planteoverskrift', 'match', 'beskrivelse'
        ])
        writer.writeheader()
        writer.writerows(resultater)
    
    print(f"✅ Rapport lagret!")

def main():
    print("🔗 Plantepugger Link Sjekker")
    print("=" * 40)
    
    # Faste filstier
    csv_fil = "/Users/henrik/Documents/Skr.brd/Koding/Blomsterapp/Ny_1.csv"
    output_base_path = "/Users/henrik/Documents/Skr.brd/Koding/Blomsterapp/"
    
    # Sjekk at input fil eksisterer
    if not os.path.exists(csv_fil):
        print(f"❌ Fant ikke input fil: {csv_fil}")
        return
    
    print(f"📖 Input fil: {csv_fil}")
    print(f"📁 Output mappe: {output_base_path}")
    
    # Standard kolonner for det nye formatet
    url_kolonne = "norskflora_url"
    navn_kolonne = "Norsk navn"
    
    try:
        # Sjekk alle linker
        resultater = sjekk_csv_linker(csv_fil, url_kolonne, navn_kolonne)
        
        # Finn neste versjonsnummer for output
        rapport_fil, versjon = finn_neste_versjon(output_base_path, "Ny_Ny")
        print(f"📁 Rapport vil bli lagret som: Ny_Ny_{versjon}.csv")
        
        # Lagre rapport automatisk
        lagre_rapport(resultater, rapport_fil)
        
        # Vis sammendrag av feil
        feil = [r for r in resultater if not r['match'] or r['status'] == 'FEIL']
        if feil:
            print(f"\n🚨 FEIL FUNNET ({len(feil)}):")
            for r in feil[:15]:
                print(f"  Rad {r['rad']}: {r['navn']} - {r['beskrivelse']}")
            if len(feil) > 15:
                print(f"  ... og {len(feil) - 15} flere (se Ny_Ny_{versjon}.csv)")
        else:
            print(f"\n🎉 Alle linker ser bra ut!")
        
    except FileNotFoundError:
        print(f"❌ Fant ikke fil: {csv_fil}")
    except Exception as e:
        print(f"❌ Feil: {e}")

if __name__ == "__main__":
    main()