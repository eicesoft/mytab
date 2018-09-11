let tabs = {};
Object.prototype.length = function() {
  let j = 0;
  for (var i in this) {
    j++;
  }
  return j;
};

function setBadge(num) {
  chrome.browserAction.setBadgeBackgroundColor({ color: "#EC272F" });
  if (num > 99) {
    num = "99+";
  }

  chrome.browserAction.setBadgeText({ text: String(num) });
}

var id = chrome.contextMenus.create({
  title: "暂存页面",
  contexts: ["page"],
  onclick: addSession
});

function addSession(event, tab) {
  chrome.tabs.remove(tab.id);
  chrome.storage.sync.get(["sessions"], function(result) {
    let sessions = [];

    if (result["sessions"] != undefined) {
      sessions = result["sessions"];
    }

    sessions.push({
      id: parseInt(Math.random() * 100000),
      url: tab.url,
      title: tab.title,
      created: new Date().getTime(),
      favIcon: tab.favIconUrl
    });
    chrome.storage.sync.set({ sessions: sessions });
  });
}

chrome.tabs.query({}, function(ts) {
  for (var i in ts) {
    tabs[ts[i].id] = ts;
  }

  setBadge(tabs.length());

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log(tab);
    tabs[tabId] = tab;
  });

  chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    let tab = tabs[tabId];
    console.log(tab);
    delete tabs[tabId];
    setBadge(tabs.length());
    chrome.storage.sync.get(["history"], function(result) {
      let _history = [];

      if (result["history"] == undefined) {
        chrome.storage.sync.set({ history: [] });
      } else {
        _history = result["history"];
      }

      if (tab != undefined) {
        try {
          if (tab.url != undefined || tab.url.indexOf("chrome://") > 0) {
            if (_history.length > 20) {
              _history.shift();
            }

            _history.push({
              id: parseInt(Math.random() * 100000),
              url: tab.url,
              title: tab.title,
              created: new Date().getTime(),
              favIcon: tab.favIconUrl
            });
            chrome.storage.sync.set({ history: _history });
          }
        } catch (err) {}
      }
    });
  });
});
