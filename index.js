import puppeteer  from "puppeteer";

function extractItems() {
    const extractedElements = document.querySelectorAll('._aano > div:nth-child(1) > div:nth-child(1) div.xt0psk2 a');
    const items = [];
    for (let element of extractedElements) {
      items.push(element.innerText);
    }
    return items;
  };

(async () =>{
    const browser = await puppeteer.launch({headless:false});
    const page = await browser.newPage();

    await page.goto('https://www.instagram.com/');

    await page.setViewport({width:1920, height:1080});

       const profile = await page.waitForSelector('div.x1iyjqo2:nth-child(2) > div:nth-child(8) > div:nth-child(1) > div:nth-child(1) > a:nth-child(1)');
       await profile.evaluate(profile => profile.click());


       const followerList = await page.waitForSelector('li.xl565be:nth-child(2) > a:nth-child(1)');
       await followerList.evaluate(followerList => followerList.click());


       const followerListIsOpen = await page.waitForSelector('._aano');
       await followerListIsOpen.evaluate(followerListIsOpen => followerListIsOpen.scrollBy(0,1000));
       
       
})();