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
    num = "20+";
  }
  chrome.browserAction.setBadgeText({ text: String(num) });
}

chrome.tabs.query({}, function(ts) {
  for (var i in ts) {
    tabs[ts[i].id] = ts;
  }

  setBadge(tabs.length());

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    tabs[tabId] = tab;
    //console.log(tabs);
    console.log(tabs);
    setBadge(tabs.length());
  });

  chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    let tab = tabs[tabId];
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
        if (tab.url != "chrome://newtab/") {
          if (_history.length > 5) {
            _history.shift();
          }

          _history.push({
            id: parseInt(Math.random() * 100000),
            url: tab.url,
            title: tab.title,
            created: new Date().getTime(),
            favIcon: tab.favIconUrl
          });
          console.log(_history);
          chrome.storage.sync.set({ history: _history });
        }
      }
    });
  });
});
