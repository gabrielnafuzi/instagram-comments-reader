const puppeteer = require('puppeteer');
const promptSync = require('prompt-sync');

const prompt = promptSync();

function getPostUrl() {
  console.clear();
  console.log('\x1b[96m');

  const postUrl = prompt(
    'Enter a instagram post link to see a list of who commented more: '
  );

  const beforePostId = postUrl.slice(0, 28).toLowerCase();
  const postId = postUrl.slice(28, postUrl.length);

  if (
    beforePostId.startsWith('https://www.instagram.com/p/') &&
    postId.length > 0
  ) {
    const fullUrl = beforePostId + postId;

    start(fullUrl);
  } else {
    console.error('\x1b[91m', 'Invalid URL...');
    setTimeout(() => {
      console.log('\x1b[96m');
      console.clear();
      getPostUrl();
    }, 1500);
  }
}

async function start(url) {
  async function loadMore(page, selector) {
    const moreButton = await page.$(selector);

    if (moreButton) {
      console.log('\x1b[92m', 'Clicking on more comments');
      await moreButton.click();

      await page
        .waitFor(selector, { timeout: 3000 })
        .catch(() => console.log('\x1b[91m', 'Finished!'));

      await loadMore(page, selector);
    }
  }

  async function getComments(page, selector) {
    const comments = await page.$$eval(selector, links =>
      links.map(link => link.innerText)
    );

    return comments;
  }

  async function pageAvailable(page, selector) {
    return (await page.$(selector)) === null ? true : false;
  }

  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.goto(url);

  const isPageAvailable = await pageAvailable(page, '._07DZ3 .MCXLF');

  if (isPageAvailable) {
    await loadMore(page, '.dCJp8');

    const users = await getComments(page, '.C4VMK h3 a');

    const counted = counter(users);

    const sorted = sort(counted);

    console.clear();
    console.log('\x1b[97m', 'List of users: \n');
    sorted.forEach(user => console.log(user));
    console.log('\x1b[93m', `\nTotal comments: ${users.length}`);
    await browser.close();

    willEnterOtherUrl();
  } else {
    console.error('\x1b[91m', `Sorry, this page isn't available.`);
    setTimeout(() => {
      console.log('\x1b[96m');
      console.clear();
      getPostUrl();
    }, 1500);
  }
}

function willEnterOtherUrl() {
  console.log('\x1b[96m', '\n');
  const resp = prompt('Do you wanna see with other post (y/n)? ');

  if (resp.toLowerCase() !== 'y') {
    process.exit(1);
  }

  getPostUrl();
}

function counter(users) {
  const count = {};
  users.forEach(user => {
    count[user] = (count[user] || 0) + 1;
  });

  return count;
}

function sort(usersCounted) {
  const entries = Object.entries(usersCounted);

  const sorted = entries.sort((a, b) => b[1] - a[1]);

  return sorted;
}

getPostUrl();
