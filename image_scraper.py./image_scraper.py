import asyncio
import json
import os
import urllib.request
from playwright.async_api import async_playwright

# Competitor UI targets
SEARCH_QUERIES = [
    "Mews PMS dashboard screenshot",
    "Mews hotel timeline grid layout",
    "Cloudbeds PMS interface walk-through",
    "Cloudbeds matrix reservation calendar",
]


async def scrape_google_images(query, max_images=15):
    print(f"🔍 Searching for: '{query}'...")

    async with async_playwright() as p:
        # Launch browser with human-like configurations
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        page = await context.new_page()

        # Format URL for Google Image Search
        search_url = (
            f"https://google.com{urllib.parse.quote(query)}&tbm=isch"
        )
        await page.goto(search_url)

        # Handle cookie consent or privacy popups if they appear
        try:
            await page.click('button:has-text("Accept all")', timeout=3000)
        except:
            pass

        image_urls = set()

        # Scroll dynamically to force lazy-loaded images to render
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            await page.wait_for_timeout(1500)  # Human-like pause

            # Locate image elements on Google's rendered DOM
            # Google commonly uses 'g-img img' or elements with an 'src' starting with http
            images = await page.query_selector_all("img")
            for img in images:
                src = await img.get_attribute("src")
                if src and src.startswith("http") and "gstatic" not in src:
                    image_urls.add(src)
                    if len(image_urls) >= max_images:
                        break
            if len(image_urls) >= max_images:
                break

        await browser.close()
        return list(image_urls)


def download_images(query, urls):
    # Organize downloads into neat folders based on target
    folder_name = "".join(x for x in query if x.isalnum() or x in "._- ").strip(
        " "
    )
    os.makedirs(f"ui_research/{folder_name}", exist_ok=True)

    print(f"📥 Downloading {len(urls)} assets to 'ui_research/{folder_name}'...")
    for i, url in enumerate(urls):
        try:
            # Add headers to request to prevent 403 Forbidden errors from host websites
            req = urllib.request.Request(
                url, headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as response, open(
                f"ui_research/{folder_name}/ui_{i+1}.jpg", "wb"
            ) as out_file:
                out_file.write(response.read())
        except Exception as e:
            continue  # Skip broken links seamlessly


async def main():
    all_results = {}
    for query in SEARCH_QUERIES:
        urls = await scrape_google_images(query, max_images=10)
        all_results[query] = urls
        download_images(query, urls)

    # Save metadata index
    with open("ui_research/manifest.json", "w") as f:
        json.dump(all_results, f, indent=4)
    print("\n🎉 Benchmarking vault populated!")


if __name__ == "__main__":
    asyncio.run(main())
