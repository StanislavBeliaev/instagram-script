import puppeteer from "puppeteer";
import "dotenv/config";

const FOLLOWING = "following/";
const FOLLOWERS = "followers/";

const INST_WEBSITE = "https://www.instagram.com/";

function extractItems() {
  const extractedElements = document.querySelectorAll(
    'div[role="dialog"] a[role="link"]'
  );
  const items = [];
  for (let element of extractedElements) {
    if (element.innerText) {
      items.push(element.innerText);
    }
  }
  return items;
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page) {
  await page.waitForSelector("input[name='username']");
  await page.type("input[name='username']", process.env.INST_LOGIN);
  await page.type("input[name='password']", process.env.INST_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForSelector(`img[alt$='${process.env.INST_LOGIN}']`);
  await page.click(`img[alt$='${process.env.INST_LOGIN}']`);
}

async function goToProfile(page) {
  await page.waitForSelector(`img[alt$='${process.env.INST_LOGIN}']`);
  await page.click(`img[alt$='${process.env.INST_LOGIN}']`);
}

async function getListOfItems(page, type) {
  await page.waitForSelector(`a[href*='/${process.env.INST_LOGIN}/${type}']`);
  await page.click(`a[href*='/${process.env.INST_LOGIN}/${type}']`);

  await page.waitForSelector('div[role="dialog"]');

  await autoScrollDialog(page);

  const items = await page.evaluate(extractItems);
  console.log(items);

  await page.click('div[role="dialog"] svg[aria-label="Закрыть"]')
  return items;
}

async function autoScrollDialog(page) {
  await page.evaluate(async () => {
    let lastHeight = 0;

    async function scroll(container, currentHeight) {
      container.scrollTo(0, container.scrollHeight);
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (currentHeight !== container.scrollHeight) {
        await scroll(container, container.scrollHeight);
      }
    }

    const scrollContainer = document.querySelector("._aano");
    await scroll(scrollContainer, lastHeight);
  });
}

async function acceptCookies(page) {
  await page.waitForSelector('div[role="dialog"]');
  await page.click('div[role="dialog"] button[tabIndex="0"]:last-child');
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(INST_WEBSITE);

  await page.setViewport({ width: 1366, height: 768 });

  await acceptCookies(page);

  await delay(2000);

  await login(page);

  await delay(1000);

  await goToProfile(page);

  await delay(1000);

  const followers = await getListOfItems(page, FOLLOWERS);
  const following = await getListOfItems(page, FOLLOWING);
})();
