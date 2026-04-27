import { saveLink,getSavedLinks,removeLink,clearAllLinks } from './storage.js';
  async function shorten() {
    const val = document.getElementById('urlInput').value.trim();
    if (!val) return;
    try{
    const response = await fetch('/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ long_url: val })
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.message || 'Unable to shorten URL');

    const short = data.short_url;
    const box = document.getElementById('resultBox');
    const link = document.getElementById('shortLink');
    const copyBtn = document.getElementById('copyBtn');
    link.textContent = short;
    link.href = short;
    box.classList.add('visible');
    copyBtn.dataset.url = short;
    copyBtn.textContent = 'Copy';
    copyBtn.classList.remove('copied');
    localStorage.setItem('lastShort', short);

    let flag=false;
    let linkset=getSavedLinks();
    linkset.forEach(l => {
      if(l.shortUrl === short)
        flag=true;
    });

    saveLink({ shortCode: data.short_url.split('/').pop(), shortUrl: data.short_url, original: val });
    
    if(!flag){
    const list = document.getElementById('historyList');
    const item = document.createElement('li'); //history item to be added to the top of history list
    item.className = 'history-item';
    const orig = val.replace(/^https?:\/\//, '');
    const origSpan = document.createElement('span');
    origSpan.className = 'history-original';
    origSpan.textContent = orig;
    //not using innerHTML to avoid XSS, since orig can be user input, and we are directly setting it as textContent
    const shortSpan = document.createElement('span');
    shortSpan.className = 'history-short';

    const linkEl = document.createElement('a');
    linkEl.href = short;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.textContent = short;

    shortSpan.appendChild(linkEl);

    item.appendChild(origSpan);
    item.appendChild(shortSpan);
    list.querySelector('ul').prepend(item);
    }
    if(document.getElementById('clearHistory')===null)
    {
      document.getElementById('no-history')?.remove();
      const allhistory=document.createElement('button');
      allhistory.textContent="Clear History";
      allhistory.className="clear-btn";
      allhistory.id="clearHistory";
      document.getElementById('card').appendChild(allhistory);
    }
  }
    catch(err){
        alert(err.message);
    }
  }

  function copyLink()
  {
    const btn = document.getElementById('copyBtn');
    const shortUrl = btn.dataset.url || document.getElementById('shortLink').href;
    if (!shortUrl) return;
    navigator.clipboard.writeText(shortUrl);
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  }

  window.onload=function renderHistory()
  {
    let history=document.getElementById('historyList');
    let savedLinks=getSavedLinks();
    const ul = document.createElement('ul');
    savedLinks.forEach((l) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const origSpan = document.createElement('span');
    origSpan.className = 'history-original';
    origSpan.textContent = l.original;

    const shortSpan = document.createElement('span');
    shortSpan.className = 'history-short';

    const linkEl = document.createElement('a');
    linkEl.href = l.shortUrl;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";
    linkEl.textContent = l.shortUrl;

    shortSpan.appendChild(linkEl);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.short = l.shortUrl.split('/').pop();
    deleteBtn.textContent = 'Delete';

    li.appendChild(origSpan);
    li.appendChild(shortSpan);
    li.appendChild(deleteBtn);

    ul.appendChild(li);
    });
    history.innerHTML = ""; // clear old content
    history.appendChild(ul);
    
    if(savedLinks.length>0)
    {
      const allhistory=document.createElement('button');
      allhistory.textContent="Clear History";
      allhistory.className="clear-btn";
      allhistory.id="clearHistory";
      document.getElementById('card').appendChild(allhistory);
    }
    else
    {
        const msg=document.createElement('p');
        msg.className="no-history";
        msg.id="no-history";
        msg.textContent="No recent links to show.\nEnter a URL above, and Voila!";
        document.getElementById('historyList').appendChild(msg);
    }
  }

  document.getElementById('historyList').addEventListener('click',(e)=>{
    if (e.target.classList.contains('delete-btn'))
    {
    const shortCode = e.target.dataset.short;
    removeLink(shortCode);
    e.target.closest('li').remove(); // remove from UI instantly
    }});

    document.getElementById('card').addEventListener('click',(e)=>{
      if(e.target.classList.contains('clear-btn')&&window.confirm("Are you sure you want to delete all links from history?\nThis action is permanent and cannot be reversed."))
      {
        clearAllLinks();
        e.target.remove();
        window.location.reload(); // refresh to clear history list from UI
      }
    });

    document.getElementById('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') shorten();
    });

  document.getElementById('shorten-btn').addEventListener('click', shorten);
  
  document.getElementById('copyBtn').addEventListener('click', copyLink);