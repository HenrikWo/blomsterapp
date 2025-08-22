import csv
import re

def endre_bilde_url(url):
    """Endrer bilde-URL til orig-versjon"""
    if not url or 'bilder.norskflora.no' not in url:
        return url
    
    # Hent filnavnet (alt etter siste /)
    filnavn = url.split('/')[-1]
    
    # Bygg ny URL med orig-mappen
    ny_url = f"https://bilder.norskflora.no/orig/{filnavn}"
    
    return ny_url

def konverter_til_nytt_format(input_fil, output_fil):
    """Konverterer fra gammelt til nytt CSV-format"""
    print(f"📖 Leser gammelt format: {input_fil}")
    
    # Gammelt format:
    # Familienavn,Vitenskapelig navn,Slekt - Norsk,Art - Norsk,Sjikt,bilde_url,wikipedia_url,bilde_status
    
    # Nytt format:
    # Norsk navn,Latinsk navn,Familie,Type,bilde_url,norskflora_url,bilde_status
    
    with open(input_fil, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"📋 Fant {len(rows)} rader i gammelt format")
    
    # Nye kolonnenavn
    nye_fieldnames = [
        'Norsk navn',
        'Latinsk navn', 
        'Familie',
        'Type',
        'bilde_url',
        'norskflora_url',
        'bilde_status'
    ]
    
    endringer = 0
    
    with open(output_fil, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=nye_fieldnames)
        writer.writeheader()
        
        for i, row in enumerate(rows, 1):
            # Konverter til nytt format
            ny_row = {
                'Norsk navn': row.get('Art - Norsk', ''),
                'Latinsk navn': row.get('Vitenskapelig navn', ''),
                'Familie': row.get('Familienavn', ''),
                'Type': row.get('Slekt - Norsk', ''),  # Bruker slekt som type
                'bilde_url': endre_bilde_url(row.get('bilde_url', '')),  # Konverterer til orig
                'norskflora_url': row.get('wikipedia_url', ''),  # Bruker wikipedia som norskflora foreløpig
                'bilde_status': row.get('bilde_status', 'IKKE_FUNNET')
            }
            
            # Tell endringer i bilde-URL
            gammel_url = row.get('bilde_url', '')
            ny_url = ny_row['bilde_url']
            if gammel_url and ny_url != gammel_url:
                endringer += 1
                print(f"[{i}] URL endret: {gammel_url} → {ny_url}")
            
            writer.writerow(ny_row)
    
    print(f"\n✅ Konvertering ferdig!")
    print(f"📁 Ny fil: {output_fil}")
    print(f"🔗 {endringer} bilde-URLer konvertert til orig-versjoner")
    print(f"📋 Format endret fra gammelt til nytt")

def bare_endre_urls(input_fil, output_fil):
    """Endrer bare bilde-URLer uten å endre format"""
    print(f"📖 Leser: {input_fil}")
    
    with open(input_fil, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"📋 Fant {len(rows)} rader")
    
    endringer = 0
    
    # Finn riktig kolonnenavn for bilde-URL
    bilde_kolonne = None
    for kolonne in fieldnames:
        if 'bilde' in kolonne.lower() and 'url' in kolonne.lower():
            bilde_kolonne = kolonne
            break
    
    if not bilde_kolonne:
        print("❌ Fant ikke bilde-URL kolonne")
        return
    
    print(f"🔍 Bruker kolonne: {bilde_kolonne}")
    
    with open(output_fil, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for i, row in enumerate(rows, 1):
            gammel_url = row.get(bilde_kolonne, '')
            
            if gammel_url:
                ny_url = endre_bilde_url(gammel_url)
                
                if ny_url != gammel_url:
                    print(f"[{i}] {gammel_url} → {ny_url}")
                    row[bilde_kolonne] = ny_url
                    endringer += 1
                else:
                    print(f"[{i}] Uendret: {gammel_url}")
            
            writer.writerow(row)
    
    print(f"\n✅ Ferdig! {endringer} URLer endret")
    print(f"📁 Ny fil: {output_fil}")

import os

def finn_neste_versjon(base_path, base_navn):
    """Finner neste tilgjengelige versjonsnummer"""
    versjon = 1
    while True:
        fil_navn = f"{base_navn}_{versjon}.csv"
        full_path = os.path.join(base_path, fil_navn)
        if not os.path.exists(full_path):
            return full_path, versjon
        versjon += 1

def main():
    print("🔄 CSV Konverter")
    print("=" * 40)
    print("1. Konverter gammelt format → nytt format (+ orig URLs)")
    print("2. Bare endre URLs til orig-versjoner")
    print("=" * 40)
    
    # Fast input fil
    input_fil = "/Users/henrik/Documents/Skr.brd/Koding/Blomsterapp/blomster_norskflora.csv"
    output_base_path = "/Users/henrik/Documents/Skr.brd/Koding/Blomsterapp/"
    
    # Sjekk at input fil eksisterer
    if not os.path.exists(input_fil):
        print(f"❌ Fant ikke input fil: {input_fil}")
        return
    
    print(f"📖 Input fil: {input_fil}")
    print(f"📁 Output mappe: {output_base_path}")
    
    valg = input("Velg (1/2): ").strip()
    
    if valg == "1":
        print("\n📝 Konverterer format og URLs...")
        output_fil, versjon = finn_neste_versjon(output_base_path, "Ny")
        print(f"📁 Output fil: Ny_{versjon}.csv")
        
        try:
            konverter_til_nytt_format(input_fil, output_fil)
        except Exception as e:
            print(f"❌ Feil: {e}")
    
    elif valg == "2":
        print("\n🔗 Endrer bare bilde-URLs...")
        output_fil, versjon = finn_neste_versjon(output_base_path, "Ny")
        print(f"📁 Output fil: Ny_{versjon}.csv")
        
        try:
            bare_endre_urls(input_fil, output_fil)
        except Exception as e:
            print(f"❌ Feil: {e}")
    
    else:
        print("❌ Ugyldig valg")

if __name__ == "__main__":
    main()