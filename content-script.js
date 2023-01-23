// Add OpenAI API Key here
const OPENAI_API_KEY = `<YOUR_OPENAI_API_KEY>`;

let lastText = null;
let isLoading = false;
const debug = true;

let isLinkedIn = window.location.origin.includes('linkedin.com');

function getApiKey() {
  chrome.storage.sync.get(['apiKey'], (result) => {
    return `${result.apiKey}`;
  });
}

async function sendServerRequest({ text, style }, linkedinElem) {
  if (debug) console.log(`Sending text: ${text}`);
  if (debug) console.log(`Sending mood: ${style}`);

  addLoading();
  // chrome.runtime.sendMessage(
  //   { text, style, isBig: Boolean(linkedinElem) },
  //   function (response) {
  //     updateInput(response, linkedinElem);

  //     if (debug) console.log(`Text Received: ${response}`);

  //     removeLoading();
  //   }
  // );

  const { response } = await generateTextFromGPT(text, style);
  if (debug) console.log('Return of Generated text:', response);

  updateInput(response, linkedinElem);
  removeLoading();
}

async function generateTextFromGPT(text = '', mood = '') {
  if (debug) console.log('input:', text);

  // const OPENAI_API_KEY = getApiKey();
  // if (debug) console.log('OpenAI API Key:', OPENAI_API_KEY);

  // if (!OPENAI_API_KEY) {
  //   const message = 'API Key is not ADDED!!!';
  //   return message;
  // }

  // prettier-ignore
  let url = `https://gpt3.serv.rs/?input=${encodeURIComponent(text)}&mood=${encodeURIComponent(mood) || ''}`;
  url += `&apiKey=${encodeURIComponent(OPENAI_API_KEY)}`;

  try {
    const response = await fetch(url, {
      Method: 'GET',
    });
    if (!response.ok) {
      // prettier-ignore
      const message = `HTTP Error ${response.status} (${response.statusText}): ${response.json()}`;
      throw new Error(message);
    }
    const data = await response.json();
    return data;
  } catch (e) {
    console.error(e);
  }
}

function textNodesUnder(node) {
  var all = [];
  for (node = node.firstChild; node; node = node.nextSibling) {
    if (node.nodeType == 3) all.push(node);
    else all = all.concat(textNodesUnder(node));
  }

  return all;
}

function findCurrentTweetText() {
  let modalText = document.querySelector('[aria-labelledby="modal-header"]');
  modalText = modalText
    ? modalText.querySelector('[data-testid="tweetText"]') ||
      modalText.querySelector('[data-testid="tweet"]')
    : null;
  let textRaw = null;

  if (modalText) {
    textRaw = textNodesUnder(modalText);
  } else {
    //select twit text (there could be a lot of them if its a thread)
    const tweetTextNodeList = document.querySelectorAll(
      '[data-testid="tweetText"]'
    );
    // check if it's active tweet (node has font size 14px)
    const tweetTextNode = Array.from(tweetTextNodeList).filter((node) => {
      const styles = getComputedStyle(node);
      return parseInt(styles.fontSize) > 20;
    });

    if (tweetTextNode.length > 0) {
      textRaw = textNodesUnder(tweetTextNode[0]);
    }
  }
  // get text from text object
  const text = textRaw
    ? textRaw
        .map((node) => node.data)
        .join(' ')
        .trim()
    : '';

  return text;
}

function addLoading() {
  const func = (buttons) => {
    if (!buttons) {
      return null;
    }

    buttons.style.opacity = 0.6;
    buttons.style.pointerEvents = 'none';
  };

  if (isLinkedIn) {
    const commentButtons = document.querySelectorAll(
      'form.comments-comment-box__form'
    );
    commentButtons.forEach((commentButton) => {
      const buttons = commentButton.querySelector('.SOCIAI_BUTTONS');
      func(buttons);
    });
  } else {
    const buttons = document.getElementById('SOCIAI_BUTTONS');
    func(buttons);
  }
}

function removeLoading() {
  const func = (buttons) => {
    if (!buttons) {
      return null;
    }

    buttons.style.opacity = 1;
    buttons.style.pointerEvents = 'auto';
  };

  if (isLinkedIn) {
    const commentButtons = document.querySelectorAll(
      'form.comments-comment-box__form'
    );
    commentButtons.forEach((commentButton) => {
      const buttons = commentButton.querySelector('.SOCIAI_BUTTONS');
      func(buttons);
    });
  } else {
    const buttons = document.getElementById('SOCIAI_BUTTONS');
    func(buttons);
  }
}

const embedButtons = () => {
  const isButtonsEmbeded = document.getElementById('SOCIAI_BUTTONS');
  if (isButtonsEmbeded) {
    return;
  }
  const toolbar = document.querySelector('[data-testid="toolBar"]');
  const text = findCurrentTweetText(); // twitt's text

  if (!toolbar) {
    requestAnimationFrame(embedButtons);
    return;
  }

  if (!text) {
    return;
  }

  isLoading = false;
  removeLoading();

  const positiveButton = document.createElement('button');
  positiveButton.innerHTML = '👍';
  positiveButton.title = 'Agree';
  positiveButton.style =
    'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 8px; font-size: 12px; font-weight: 700';
  positiveButton.addEventListener('click', (e) => {
    sendServerRequest({ text, style: 'positive' });
  });

  const disagreeButton = document.createElement('button');
  disagreeButton.innerHTML = '👎';
  disagreeButton.title = 'Disagree';
  disagreeButton.style =
    'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; font-weight: 700; border-radius: 9999px; padding: 3px 8px; font-size: 12px; margin-left: 8px;';
  disagreeButton.addEventListener('click', (e) => {
    sendServerRequest({ text, style: 'disagree' });
  });

  const funnyButton = document.createElement('button');
  funnyButton.innerHTML = '😂';
  funnyButton.title = 'Funny';
  funnyButton.style =
    'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 8px; font-size: 12px; font-weight: 700;  margin-left: 8px;';
  funnyButton.addEventListener('click', (e) => {
    sendServerRequest({ text, style: 'funny' });
  });

  const ideaButton = document.createElement('button');
  ideaButton.innerHTML = '💡';
  ideaButton.title = 'Idea';
  ideaButton.style =
    'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 8px; font-size: 12px; font-weight: 700; margin-left: 8px;';
  ideaButton.addEventListener('click', (e) => {
    sendServerRequest({ text, style: 'idea' });
  });

  const questionButton = document.createElement('button');
  questionButton.innerHTML = '❓';
  questionButton.title = 'Question';
  questionButton.style =
    'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 8px; font-size: 12px; font-weight: 700; margin-left: 8px;';
  questionButton.addEventListener('click', (e) => {
    sendServerRequest({ text, style: 'question' });
  });

  const poweredByLabel = document.createElement('div');
  poweredByLabel.innerHTML =
    '<a href="https://sociai.com" target="_blank" style="color: #1da1f2; text-decoration: none; font-size: 11px;">by SociAI</a>';
  poweredByLabel.style =
    'margin-left: 8px; font-size: 12px; font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;';

  const buttons = document.createElement('div');
  buttons.id = 'SOCIAI_BUTTONS';
  buttons.style =
    'display: flex; align-items: center; height: 100%; margin-top: 8px;';

  buttons.appendChild(positiveButton);
  buttons.appendChild(funnyButton);
  buttons.appendChild(ideaButton);
  buttons.appendChild(disagreeButton);
  buttons.appendChild(questionButton);

  // add buttons to tweet actions
  toolbar.firstElementChild.style.marginTop = '9px';
  toolbar.lastElementChild.style.marginTop = '9px';
  toolbar.parentNode.prepend(buttons);
};

const updateInput = (newText, linkedinElem) => {
  if (linkedinElem) {
    linkedinElem.innerHTML = '<p>' + newText + '</p>';
    return;
  }

  const input =
    linkedinElem || document.querySelector('[data-testid="tweetTextarea_0"]');

  const data = new DataTransfer();
  data.setData('text/plain', newText);
  input.dispatchEvent(
    new ClipboardEvent('paste', {
      dataType: 'text/plain',
      data: newText,
      bubbles: true,
      clipboardData: data,
      cancelable: true,
    })
  );
};

// Linkedin code

function getLinkedInText(elem) {
  const text = elem
    .closest('.feed-shared-update-v2')
    .querySelector('.feed-shared-update-v2__description')
    .textContent.trim()
    .replaceAll('\n', '')
    .replaceAll('…see more', '');
  return text;
}

const embedLinkedinButtons = () => {
  const commentButtons = document.querySelectorAll(
    'form.comments-comment-box__form'
  );

  Array.from(commentButtons).forEach((b) => {
    if (b.querySelector('.SOCIAI_BUTTONS')) {
      return;
    }

    const positiveButton = document.createElement('div');
    positiveButton.innerHTML = '👍';
    positiveButton.title = 'Agree';
    positiveButton.style =
      'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 6px; font-size: 12px; font-weight: 700';
    positiveButton.addEventListener('click', (e) => {
      const text = getLinkedInText(e.target);
      const elem = b.querySelector('.ql-editor');
      sendServerRequest({ text, style: 'positive' }, elem);
    });

    const disagreeButton = document.createElement('div');
    disagreeButton.innerHTML = '👎';
    disagreeButton.title = 'Disagree';
    disagreeButton.style =
      'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; font-weight: 700; border-radius: 9999px; padding: 3px 6px; font-size: 12px; margin-left: 6px;';
    disagreeButton.addEventListener('click', (e) => {
      const text = getLinkedInText(e.target);
      const elem = b.querySelector('.ql-editor');
      sendServerRequest({ text, style: 'disagree' }, elem);
    });
    const funnyButton = document.createElement('div');
    funnyButton.innerHTML = '😂';
    funnyButton.title = 'Funny';
    funnyButton.style =
      'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 6px; font-size: 12px; font-weight: 700;  margin-left: 6px;';
    funnyButton.addEventListener('click', (e) => {
      const text = getLinkedInText(e.target);
      const elem = b.querySelector('.ql-editor');
      sendServerRequest({ text, style: 'funny' }, elem);
    });

    const ideaButton = document.createElement('div');
    ideaButton.innerHTML = '💡';
    ideaButton.title = 'Idea';
    ideaButton.style =
      'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 6px; font-size: 12px; font-weight: 700; margin-left: 6px;';
    ideaButton.addEventListener('click', (e) => {
      const text = getLinkedInText(e.target);
      const elem = b.querySelector('.ql-editor');
      sendServerRequest({ text, style: 'idea' }, elem);
    });

    const questionButton = document.createElement('div');
    questionButton.innerHTML = '❓';
    questionButton.title = 'Question';
    questionButton.style =
      'cursor: pointer; color: #1d9bf0; border: 1px solid #1d9bf0; background: transparent; border-radius: 9999px; padding: 3px 6px; font-size: 12px; font-weight: 700; margin-left: 6px;';
    questionButton.addEventListener('click', (e) => {
      const text = getLinkedInText(e.target);
      const elem = b.querySelector('.ql-editor');
      sendServerRequest({ text, style: 'question' }, elem);
    });

    const buttons = document.createElement('div');
    buttons.id = 'SOCIAI_BUTTONS';
    buttons.className = 'SOCIAI_BUTTONS';
    buttons.appendChild(positiveButton);
    buttons.appendChild(disagreeButton);
    buttons.appendChild(funnyButton);
    buttons.appendChild(ideaButton);
    buttons.appendChild(questionButton);

    buttons.style =
      'display: flex; align-items: center; height: 100%; margin-top: 8px;';

    b.appendChild(buttons);
  });
};

// check whether it's linkedin or twitter
if (window.location.origin.includes('twitter.com')) {
  setInterval(embedButtons, 100);
} else if (window.location.origin.includes('linkedin.com')) {
  setInterval(embedLinkedinButtons, 100);
}
