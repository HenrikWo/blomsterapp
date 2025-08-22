import requests
import csv
import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class NorskFloraSeleniumHenter:
    def __init__(self):
        # Sett opp Chrome med headless mode
        self.chrome_options = Options()
        self.chrome_options.add_argument('--headless')  # Kjør uten GUI
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        self.chrome_options.add_argument('--disable-gpu')
        self.chrome_options.add_argument('--window-size=1920,1080')
    
    def parse_latinsk_navn(self, latinsk_navn):
        """Parser latinsk navn til slekt og art"""
        if not latinsk_navn:
            return None, None
        
        navn = latinsk_navn.strip()
        deler = navn.split()
        if len(deler) >= 2:
            return deler[0], deler[1]
        return None, None
    
    def hent_bilde_selenium(self, slekt, art):
        """Hent bilde med Selenium"""
        driver = None
        try:
            print(f"   🤖 Starter Chrome...")
            driver = webdriver.Chrome(options=self.chrome_options)
            
            plant_url = f"https://norskflora.no/plante/?sle={slekt}&art={art}"
            print(f"   🔗 Laster: {plant_url}")
            
            driver.get(plant_url)
            
            # Vent på at siden laster (React trenger tid)
            print(f"   ⏳ Venter på React...")
            wait = WebDriverWait(driver, 15)
            
            # Vent på slideshow
            try:
                slideshow = wait.until(
                    EC.presence_of_element_located((By.CLASS_NAME, "slideshow"))
                )
                print(f"   📸 Slideshow funnet!")
                
                # Finn img i slideshow
                img = slideshow.find_element(By.TAG_NAME, "img")
                bilde_url = img.get_attribute("src")
                
                if bilde_url and 'bilder.norskflora.no' in bilde_url:
                    print(f"   ✅ Bilde hentet: {bilde_url}")
                    return bilde_url, plant_url
                else:
                    print(f"   ❌ Ugyldig bilde-URL: {bilde_url}")
                    
            except Exception as slideshow_error:
                print(f"   ⚠️ Slideshow ikke funnet: {slideshow_error}")
                
                # Fallback: søk etter alle norskflora-bilder
                print(f"   🔍 Søker etter alle bilder...")
                imgs = driver.find_elements(By.TAG_NAME, "img")
                
                for img in imgs:
                    src = img.get_attribute("src")
                    if src and 'bilder.norskflora.no' in src:
                        print(f"   ✅ Fallback bilde: {src}")
                        return src, plant_url
            
            print(f"   ❌ Ingen bilder funnet")
            return None, plant_url
            
        except Exception as e:
            print(f"   💥 Selenium feil: {e}")
            return None, None
            
        finally:
            if driver:
                driver.quit()
    
    def behandle_csv_selenium(self, input_csv, output_csv):
        """Behandler CSV med Selenium"""
        print(f"📖 Leser CSV: {input_csv}")
        
        with open(input_csv, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)
        
        print(f"📋 Fant {len(rows)} arter")
        
        nye_fieldnames = list(fieldnames) + ['bilde_url', 'norskflora_url', 'bilde_status']
        
        suksess = 0
        feil = 0
        ingen_latin = 0
        
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=nye_fieldnames)
            writer.writeheader()
            
            for i, row in enumerate(rows, 1):
                print(f"\n{'='*60}")
                print(f"[{i}/{len(rows)}] ", end="")
                
                norsk_navn = row.get('Norsk navn', '').strip()
                latinsk_navn = row.get('Latinsk navn', '').strip()
                
                print(f"{norsk_navn}")
                
                if not norsk_navn:
                    print(f"   ⚠️ Mangler norsk navn")
                    row['bilde_url'] = ''
                    row['norskflora_url'] = ''
                    row['bilde_status'] = 'MANGLER_NAVN'
                    writer.writerow(row)
                    continue
                
                if not latinsk_navn:
                    print(f"   ⚠️ Mangler latinsk navn")
                    ingen_latin += 1
                    row['bilde_url'] = ''
                    row['norskflora_url'] = ''
                    row['bilde_status'] = 'MANGLER_LATINSK'
                    writer.writerow(row)
                    continue
                
                slekt, art = self.parse_latinsk_navn(latinsk_navn)
                
                if not slekt or not art:
                    print(f"   ❌ Ugyldig latinsk: {latinsk_navn}")
                    feil += 1
                    row['bilde_url'] = ''
                    row['norskflora_url'] = ''
                    row['bilde_status'] = 'UGYLDIG_LATINSK'
                    writer.writerow(row)
                    continue
                
                print(f"   Søker: {slekt} {art}")
                
                # Hent bilde med Selenium
                bilde_url, side_url = self.hent_bilde_selenium(slekt, art)
                
                row['bilde_url'] = bilde_url or ''
                row['norskflora_url'] = side_url or ''
                row['bilde_status'] = 'FUNNET' if bilde_url else 'IKKE_FUNNET'
                
                if bilde_url:
                    suksess += 1
                    print(f"   🎉 SUKSESS!")
                else:
                    feil += 1
                    print(f"   😞 INGEN BILDE")
                
                writer.writerow(row)
                
                # Pause mellom forespørsler
                time.sleep(2)
        
        print(f"\n{'='*60}")
        print(f"🎉 FERDIG!")
        print(f"✅ {suksess} bilder hentet")
        print(f"❌ {feil} uten bilder")
        print(f"⚠️ {ingen_latin} mangler latinsk")
        print(f"📁 Lagret: {output_csv}")
        
        return suksess, feil

def main():
    scraper = NorskFloraSeleniumHenter()
    
    print("🤖 Norsk Flora Selenium Scraper")
    print("=" * 50)
    print("Bruker Chrome headless for å laste React-appen")
    print()
    
    input_fil = "midlertidig.csv"
    output_fil = "blomster_norskflora.csv"
    
    if not os.path.exists(input_fil):
        print(f"❌ Finner ikke: {input_fil}")
        return
    
    # Test først med én art
    print("🧪 Testing med Geum urbanum...")
    bilde_url, side_url = scraper.hent_bilde_selenium("Geum", "urbanum")
    
    if bilde_url:
        print(f"✅ Test OK! Starter full prosessering...")
        time.sleep(2)
        scraper.behandle_csv_selenium(input_fil, output_fil)
    else:
        print(f"❌ Test feilet - sjekk Selenium setup")

if __name__ == "__main__":
    main()