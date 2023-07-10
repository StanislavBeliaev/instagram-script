import puppeteer from "puppeteer";
import fs from "fs";
import "dotenv/config";



const FOLLOWING = "following/";
const FOLLOWERS = "followers/";

const INST_WEBSITE = "https://www.instagram.com/";

function extractItems() {
  //берем ссылки из контейнера который содержит имена фолловеров или подписчиков
  const extractedElements = document.querySelectorAll(
    '._aano > div:nth-child(1) > div:nth-child(1) div.xt0psk2 a'
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

//функция сравнения подписчиков и подписок:
async function findMissingNames(arr1, arr2) {

  let missingNames = [];

  for (let i = 0; i < arr1.length; i++) {
    let name = arr1[i];
    let found = false;

    for (let j = 0; j < arr2.length; j++) {
      if (name === arr2[j]) {
        found = true;
        break;
      }
    }

    if (!found) {
      missingNames.push(name);
    }
  }
  console.log(missingNames)
  return missingNames;
}

async function unSubscribe(page,type,names){
  const unSubs = [];
  await page.waitForSelector(`a[href*='/${process.env.INST_LOGIN}/${type}']`);
  await page.click(`a[href*='/${process.env.INST_LOGIN}/${type}']`);

  await page.waitForSelector('div[role="dialog"]');

  for (const name of names){
    
    const nameElement = await page.$(
      `._aano > div:nth-child(1) > div:nth-child(1) div.xt0psk2 a[href*='/${name}/']`
    );
      if(nameElement){
        //наводим мышку на имя того на кого подписаны и кто не подписан на нас для того чтобы всплыло модальное окно
        await nameElement.hover();
        await delay(2000);
        //ожидаем появления селектора кнопки "Подписки" в модальном окне
        await page.waitForSelector('._acan._acap._acaq._acat._aj1-');
        await page.click('._acan._acap._acaq._acat._aj1-');
        //после всплывет еще 1 модальное окно в котором уже ждем селектор кнопки "Отменить подписку"
        await page.waitForSelector('._a9--._a9-_');
        await delay(1000);
        await page.click('._a9--._a9-_');
        await delay(1000);
        console.log('вы отписались от:', name)
        unSubs.push(name)
      }
      
  }
  return unSubs;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(INST_WEBSITE);

  await page.setViewport({ width: 1366, height: 768 });

  // await acceptCookies(page);

  // await delay(2000);

  await login(page);

  // await delay(1000);

  await goToProfile(page);

  // await delay(1000);

  const followers = await getListOfItems(page, FOLLOWERS);
  const following = await getListOfItems(page, FOLLOWING);
  const different = await findMissingNames(following,followers);
  const unSub = await unSubscribe(page,FOLLOWING,different);
  fs.writeFileSync('./report_date_time.csv', unSub.join('\n') + '\n');

})();
