import csv
import os

def fikse_kolonner(input_fil, output_fil=None):
    """
    Reorganiserer CSV-kolonner til riktig rekkefølge
    """
    if not output_fil:
        # Hvis ingen output-fil spesifisert, lag backup og overskrive original
        backup_fil = input_fil.replace('.csv', '_backup.csv')
        output_fil = input_fil
        print(f"📄 Lager backup: {backup_fil}")
        # Kopier original til backup
        import shutil
        shutil.copy2(input_fil, backup_fil)
    
    # Ønsket kolonnerækkefølge
    onsket_rekkefølge = [
        'Norsk navn',
        'Latinsk navn', 
        'Familie',
        'Type',
        'bilde_url',
        'norskflora_url',
        'bilde_status'
    ]
    
    print(f"📖 Leser: {input_fil}")
    
    # Les inn CSV
    with open(input_fil, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        original_fieldnames = reader.fieldnames
        rows = list(reader)
    
    print(f"📋 Original kolonnerækkefølge:")
    for i, col in enumerate(original_fieldnames):
        print(f"  {i+1}. {col}")
    
    print(f"\n🎯 Ønsket kolonnerækkefølge:")
    for i, col in enumerate(onsket_rekkefølge):
        print(f"  {i+1}. {col}")
    
    # Sjekk at alle ønskede kolonner eksisterer
    manglende = []
    for col in onsket_rekkefølge:
        if col not in original_fieldnames:
            manglende.append(col)
    
    if manglende:
        print(f"\n⚠️ Manglende kolonner: {manglende}")
        print("Legger til tomme kolonner...")
    
    # Legg til eventuelle ekstra kolonner som ikke er i ønsket liste
    alle_kolonner = onsket_rekkefølge.copy()
    for col in original_fieldnames:
        if col not in alle_kolonner:
            alle_kolonner.append(col)
            print(f"➕ Beholder ekstra kolonne: {col}")
    
    # Skriv ny CSV med riktig rekkefølge
    print(f"\n💾 Skriver til: {output_fil}")
    
    with open(output_fil, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=alle_kolonner)
        writer.writeheader()
        
        for row in rows:
            # Sørg for at alle kolonner eksisterer (fyll inn tomme hvis de mangler)
            for col in alle_kolonner:
                if col not in row:
                    row[col] = ''
            writer.writerow(row)
    
    print(f"\n✅ Ferdig!")
    print(f"📊 Prosesserte {len(rows)} rader")
    print(f"🔄 Reorganiserte fra {len(original_fieldnames)} til {len(alle_kolonner)} kolonner")
    
    # Vis første rad som eksempel
    if rows:
        print(f"\n📋 Eksempel (første rad):")
        for col in alle_kolonner:
            value = rows[0].get(col, '')
            if len(str(value)) > 50:
                value = str(value)[:47] + "..."
            print(f"  {col}: {value}")

def main():
    """
    Hovedfunksjon - fikser CSV kolonnerækkefølge
    """
    print("🔧 CSV KOLONNE-FIKSER")
    print("=" * 40)
    print("Reorganiserer kolonner til riktig rekkefølge")
    print()
    
    # Standard fil-stier
    mulige_filer = [
        "/Users/henrik/Desktop/mappe uten navn/norskflora_med_bilder_selenium.csv",
        "/Users/henrik/Desktop/mappe uten navn/norskflora_database_med_bilder.csv",
        "/Users/henrik/Desktop/mappe uten navn/midlertidig_med_urls.csv"
    ]
    
    # Finn eksisterende filer
    eksisterende_filer = []
    for fil in mulige_filer:
        if os.path.exists(fil):
            eksisterende_filer.append(fil)
    
    if eksisterende_filer:
        print("📁 Fant disse CSV-filene:")
        for i, fil in enumerate(eksisterende_filer):
            print(f"  {i+1}. {os.path.basename(fil)}")
        
        print()
        valg = input(f"Velg fil å fikse (1-{len(eksisterende_filer)}), eller skriv full sti: ").strip()
        
        if valg.isdigit() and 1 <= int(valg) <= len(eksisterende_filer):
            input_fil = eksisterende_filer[int(valg) - 1]
        else:
            input_fil = valg
    else:
        input_fil = input("Skriv full sti til CSV-fil: ").strip()
    
    if not os.path.exists(input_fil):
        print(f"❌ Finner ikke filen: {input_fil}")
        return
    
    # Spør om output
    output_valg = input("Overskrive original fil? (j/n, ENTER for ja): ").lower().strip()
    
    if output_valg == 'n':
        output_fil = input_fil.replace('.csv', '_fikset.csv')
        print(f"📝 Ny fil vil bli: {output_fil}")
    else:
        output_fil = None  # Dette trigger backup + overskrivning
    
    # Kjør fiksing
    fikse_kolonner(input_fil, output_fil)

if __name__ == "__main__":
    main()