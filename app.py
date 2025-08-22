import requests
import csv
import time
import os
import re

class LatinBlomsterBildeLinkGenerator:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'BlomsterApp/2.0 (educational; contact@example.com)'
        })
    
    def rens_latinsk_navn(self, latinsk_navn):
        """Renser latinsk navn for bedre søk"""
        if not latinsk_navn:
            return None
        
        # Fjern ekstra informasjon i parenteser, forfatternavn osv.
        navn = re.sub(r'\([^)]*\)', '', latinsk_navn)  # Fjern parenteser
        navn = re.sub(r'\s+L\.?$', '', navn)  # Fjern "L." på slutten (Linnaeus)
        navn = re.sub(r'\s+\w+\.\s*$', '', navn)  # Fjern andre forfatterforkortelser
        navn = re.sub(r'\s+var\..*$', '', navn)  # Fjern varietetsinfo
        navn = re.sub(r'\s+subsp\..*$', '', navn)  # Fjern underartsinfo
        navn = re.sub(r'\s+f\..*$', '', navn)  # Fjern formsinfo
        
        # Rens og trim
        navn = ' '.join(navn.split())  # Fjern ekstra mellomrom
        
        # Sjekk at vi har minst genus og species
        parts = navn.split()
        if len(parts) >= 2:
            return f"{parts[0]} {parts[1]}"  # Ta kun genus + species
        
        return navn if navn else None
    
    def søk_wikipedia_med_latinsk(self, latinsk_navn, språk='en'):
        """Søker spesifikt etter latinsk navn på Wikipedia"""
        if not latinsk_navn:
            return None, None
            
        # Rens navnet først
        rensed_navn = self.rens_latinsk_navn(latinsk_navn)
        if not rensed_navn:
            return None, None
        
        print(f"   🔍 Søker på {språk} Wikipedia: {rensed_navn}")
        
        base_url = f"https://{språk}.wikipedia.org/api/rest_v1/page/summary/"
        search_url = base_url + rensed_navn.replace(" ", "_")
        
        try:
            response = self.session.get(search_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                # Sjekk at det faktisk er en planteart
                title = data.get('title', '').lower()
                extract = data.get('extract', '').lower()
                
                # Enkle sjekker for å unngå feil artikler
                plant_keywords = ['plant', 'flower', 'tree', 'herb', 'shrub', 'species', 'genus', 'family']
                wrong_keywords = ['disambiguation', 'person', 'place', 'city', 'album', 'book']
                
                # Sjekk om det ser ut som en planteart
                has_plant_context = any(keyword in extract for keyword in plant_keywords)
                has_wrong_context = any(keyword in title or keyword in extract for keyword in wrong_keywords)
                
                if has_wrong_context and not has_plant_context:
                    print(f"   ⚠️ Hopper over - ser ikke ut som en planteart")
                    return None, None
                
                if 'thumbnail' in data:
                    thumbnail_url = data['thumbnail']['source']
                    
                    # Bygg riktig bilde-URL med 500px størrelse
                    if '/thumb/' in thumbnail_url:
                        parts = thumbnail_url.split('/')
                        original_filename = parts[-1]
                        
                        # Hvis det allerede har størrelse-prefix, fjern det
                        if original_filename.count('-') >= 1 and original_filename.split('-')[0].endswith('px'):
                            original_filename = '-'.join(original_filename.split('-')[1:])
                        
                        # Bygg ny URL med 500px størrelse
                        thumb_path = '/'.join(parts[:-1])
                        ny_url = f"{thumb_path}/500px-{original_filename}"
                        
                        # Hent Wikipedia artikkel-URL
                        wiki_url = data.get('content_urls', {}).get('desktop', {}).get('page', '')
                        
                        return ny_url, wiki_url
                        
                return None, None
            return None, None
        except Exception as e:
            print(f"   ⚠️ Feil ved {språk} Wikipedia: {e}")
            return None, None
    
    def finn_beste_latin_bildelink(self, norsk_navn, latin_navn):
        """Finner beste bildelink ved å fokusere på latinsk navn"""
        print(f"🌸 Søker bilde for: {norsk_navn} ({latin_navn})")
        
        if not latin_navn or latin_navn.strip() == '':
            print(f"   ❌ Mangler latinsk navn")
            return None, None
        
        # Strategi 1: Latinsk navn på engelsk Wikipedia (best for planter)
        bilde_url, wiki_url = self.søk_wikipedia_med_latinsk(latin_navn, 'en')
        if bilde_url:
            print(f"   ✅ Fant med latinsk navn på engelsk Wikipedia")
            return bilde_url, wiki_url
        
        # Strategi 2: Latinsk navn på norsk Wikipedia
        print(f"   🔍 Prøver norsk Wikipedia...")
        bilde_url, wiki_url = self.søk_wikipedia_med_latinsk(latin_navn, 'no')
        if bilde_url:
            print(f"   ✅ Fant med latinsk navn på norsk Wikipedia")
            return bilde_url, wiki_url
        
        # Strategi 3: Prøv med kun genus (slektsnavn)
        if ' ' in latin_navn:
            genus = latin_navn.split()[0]
            print(f"   🔍 Prøver kun genus: {genus}")
            bilde_url, wiki_url = self.søk_wikipedia_med_latinsk(genus, 'en')
            if bilde_url:
                print(f"   ✅ Fant med genus på engelsk Wikipedia")
                return bilde_url, wiki_url
        
        # Strategi 4: Søk på norsk navn som backup
        print(f"   🔍 Backup: søker på norsk navn...")
        bilde_url, wiki_url = self.søk_wikipedia_med_latinsk(norsk_navn, 'no')
        if bilde_url:
            print(f"   ✅ Fant med norsk navn som backup")
            return bilde_url, wiki_url
        
        print(f"   ❌ Fant ikke bilde for: {norsk_navn}")
        return None, None
    
    def behandle_csv_latin_fokus(self, input_csv, output_csv):
        """Behandler CSV med fokus på latinske navn"""
        print(f"📖 Leser CSV: {input_csv}")
        
        # Les originalfil
        with open(input_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)
        
        print(f"📋 Fant {len(rows)} blomster å behandle")
        print(f"🔄 Kolonner: {fieldnames}")
        
        # Legg til nye kolonner
        nye_fieldnames = list(fieldnames) + ['bilde_url', 'wikipedia_url', 'bilde_status', 'søk_metode']
        
        # Behandle hver rad
        suksess = 0
        feil = 0
        latin_mangler = 0
        
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=nye_fieldnames)
            writer.writeheader()
            
            for i, row in enumerate(rows, 1):
                print(f"\n[{i}/{len(rows)}] ", end="")
                
                # Hent data fra raden
                norsk_navn = row.get('Art - Norsk', '').strip()
                latin_navn = row.get('Vitenskapelig navn', '').strip()
                
                if not norsk_navn:
                    print(f"⚠️ Mangler norsk navn, hopper over rad {i}")
                    row['bilde_url'] = ''
                    row['wikipedia_url'] = ''
                    row['bilde_status'] = 'MANGLER_NAVN'
                    row['søk_metode'] = 'INGEN'
                    writer.writerow(row)
                    continue
                
                if not latin_navn:
                    print(f"⚠️ Mangler latinsk navn for {norsk_navn}")
                    latin_mangler += 1
                    row['bilde_url'] = ''
                    row['wikipedia_url'] = ''
                    row['bilde_status'] = 'MANGLER_LATIN'
                    row['søk_metode'] = 'INGEN'
                    writer.writerow(row)
                    continue
                
                # Finn bildelink med latinsk fokus
                bilde_url, wiki_url = self.finn_beste_latin_bildelink(norsk_navn, latin_navn)
                
                # Oppdater rad
                row['bilde_url'] = bilde_url or ''
                row['wikipedia_url'] = wiki_url or ''
                row['bilde_status'] = 'FUNNET' if bilde_url else 'IKKE_FUNNET'
                row['søk_metode'] = 'LATINSK' if bilde_url else 'INGEN'
                
                if bilde_url:
                    suksess += 1
                else:
                    feil += 1
                
                writer.writerow(row)
                
                # Progress-rapport
                if i % 10 == 0:
                    print(f"\n📊 Status: {suksess} funnet, {feil} ikke funnet, {latin_mangler} mangler latinsk")
                    print("-" * 60)
                
                # Pause for å ikke overbelaste serverne
                time.sleep(0.7)
        
        print(f"\n🎉 Ferdig!")
        print(f"✅ {suksess} blomster med bilder")
        print(f"❌ {feil} blomster uten bilder")
        print(f"⚠️ {latin_mangler} blomster mangler latinsk navn")
        print(f"📁 Ny fil lagret som: {output_csv}")
        
        if latin_mangler > 0:
            print(f"\n💡 Tips: Legg til manglende latinske navn i original CSV for bedre resultater")
        
        return suksess, feil, latin_mangler

def main():
    generator = LatinBlomsterBildeLinkGenerator()
    
    print("🌸 Latinsk Navn Bildelink Generator")
    print("=" * 50)
    print("Dette programmet fokuserer på latinske navn for mer presise søk")
    print()
    
    # Input fil
    input_fil = input("Skriv inn navn på input CSV-fil (eller Enter for 'blomster.csv'): ").strip()
    if not input_fil:
        input_fil = "blomster.csv"
    
    # Output fil
    output_fil = input("Skriv inn navn på output CSV-fil (eller Enter for 'blomster_latin_bilder.csv'): ").strip()
    if not output_fil:
        output_fil = "blomster_latin_bilder.csv"
    
    # Sjekk at input-fil eksisterer
    if not os.path.exists(input_fil):
        print(f"❌ Finner ikke filen: {input_fil}")
        print(f"📁 Leter i mappe: {os.getcwd()}")
        
        # List CSV-filer i mappen
        csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]
        if csv_files:
            print(f"📋 Tilgjengelige CSV-filer: {csv_files}")
        return
    
    # Behandle CSV
    try:
        suksess, feil, latin_mangler = generator.behandle_csv_latin_fokus(input_fil, output_fil)
        
        print(f"\n📈 Sammendrag:")
        total = suksess + feil + latin_mangler
        if total > 0:
            print(f"   Suksessrate: {suksess/total*100:.1f}%")
            print(f"   Med latinsk navn: {(suksess+feil)/total*100:.1f}%")
        print(f"   Total: {total} blomster")
        
        if suksess > 100:
            print(f"\n🎉 Flott! Du har nå {suksess} blomster med bilder - perfekt for appen!")
        
    except Exception as e:
        print(f"❌ Feil under behandling: {e}")

if __name__ == "__main__":
    main()