let _windows = {};
let _currentWindow = null;
let _winCount = 0;
let _history = [];

var Session = {
  sessions: [],
  init() {
    chrome.storage.sync.get(["sessions"], function(result) {
      if (result["sessions"] == undefined) {
        chrome.storage.sync.set({ sessions: [] });
      } else {
        Session.sessions = result["sessions"];
      }
    });
  },
  add(tab) {}
};

chrome.storage.sync.get(["history"], function(result) {
  if (result["history"] == undefined) {
    chrome.storage.sync.set({ history: [] });
  } else {
    _history = result["history"];
  }

  chrome.windows.getCurrent(function(win) {
    _currentWindow = win;
    chrome.windows.getAll(function(windows) {
      for (var i in windows) {
        let id = windows[i].id;
        _windows[id] = windows[i];

        chrome.tabs.query({ windowId: id }, function(tabs) {
          console.log(id + " SET TAB " + tabs.length);
          _windows[id]["tabs"] = tabs;
          _winCount++;
          if (_winCount >= windows.length) {
            build_wins();
          }
        });
      }
    });
  });
});

function build_tabs(tabs, wid) {
  let html = [];
  for (var i in tabs) {
    let tab = tabs[i];
    let tab_css = "";
    if (tab.active) {
      tab_css = " active";
    }
    html.push(
      "<div class='tab-item" +
        tab_css +
        "' id='tid_" +
        tab.id +
        "'><a class='open' data-tid='" +
        tab.id +
        "' data-wid='" +
        wid +
        "' href='javascript:'><span title='" +
        tab.title +
        "'>" +
        "<img class='icon' src='" +
        (tab["favIconUrl"] != undefined ? tab.favIconUrl : "/images/page.png") +
        "' />" +
        tab.title +
        "</span></a><a><span class='save glyphicon glyphicon-save' title='暂存'></span></a><a><span data-tid='" +
        tab.id +
        "' data-wid='" +
        wid +
        "' data-json='" +
        JSON.stringify(tab) +
        "' class='remove glyphicon glyphicon-remove' title='关闭'></span></a></div>"
    );
  }

  return html.join("");
}

function cmphis(a, b) {}

function buildHitory() {
  let html = [];
  let h = _history.sort(function(a, b) {
    return a["created"] > b["created"] ? 0 : 1;
  });
  for (var i in h) {
    let his = h[i];

    html.push(
      "<div class='history-item' id='his_" +
        his.id +
        "'><a data-json='" +
        JSON.stringify(his) +
        "'  class='open' href='javascript:'><span>" +
        "<img onerror=\"this.src=''\" class='icon' src='" +
        his.favIcon +
        "' />" +
        his.title +
        "</span></a><a><span data-json='" +
        JSON.stringify(his) +
        "' class='remove glyphicon glyphicon-remove' title='删除'></span></a></div>"
    );
  }
  html.push("<div class='clear'></div>");
  return html.join("");
}

function build_wins() {
  console.log(_windows);
  let html = [];

  var i = 1;
  for (var id in _windows) {
    let win_css = "";
    if (_windows[id].focused) {
      win_css = " active";
    }

    html.push("<div class='win_panel>");
    html.push(
      "<div data-wid='" +
        id +
        "' class='win-item" +
        win_css +
        "''><a href='javascript:'>Window " +
        i++ +
        ": </a></div>"
    );
    html.push(build_tabs(_windows[id]["tabs"], id));
    html.push("<div class='clear'></div>");
    html.push("</div>");
  }

  var his_html = buildHitory();
  var hisList = document.getElementById("hisList");
  hisList.innerHTML = his_html;

  $(".history-item>a").click(function() {
    let tab = $(this).data("json");
    chrome.tabs.create({ url: tab["url"] });
    $("#his_" + tab["id"]).remove();
    let history = [];
    for (var i in _history) {
      if (_history[i]["id"] != tab["id"]) {
        history.push(_history[i]);
      }
    }
    _history = history;
    chrome.storage.sync.set({ history: _history });
  });

  $(".history-item .remove").click(function() {
    let tab = $(this).data("json");
    $("#his_" + tab["id"]).remove();
    console.log(_history);
    let history = [];
    for (var i in _history) {
      if (_history[i]["id"] != tab["id"]) {
        history.push(_history[i]);
      }
    }
    _history = history;
    chrome.storage.sync.set({ history: _history });
  });

  var winList = document.getElementById("winList");
  winList.innerHTML = html.join("");

  $(".tab-item>a").click(function() {
    let id = $(this).data("tid");
    let wid = $(this).data("wid");
    if (wid == _currentWindow.id) {
      chrome.tabs.update(id, { active: true });
    } else {
      chrome.windows.update(wid, { focused: true }, function() {
        chrome.tabs.update(id, { active: true });
      });
    }
  });

  $("img").on("error", function() {
    $(this).attr("src", "/images/page.png");
  });

  $(".tab-item .remove").click(function() {
    let id = $(this).data("tid");
    let tab = $(this).data("json");

    chrome.tabs.remove(id);
  });

  $(".win-item").click(function() {
    let id = $(this).data("wid");
    $("#tab_" + id).hide();

    chrome.windows.update(id, { focused: true });
  });
}
