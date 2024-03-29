// var ctx = $("#canvas")[0].getContext("2d");
// var ctx = document.createElement('canvas').getContext("2d")
var getYear = function () {
  var date = new Date();
  return date.getFullYear().toString();
};
var getMonth = function () {
  var date = new Date();
  return [date.getFullYear(), date.getMonth() + 1].join("-");
};
var canFav = 1;
var currentTabId = null;
// var favImg = new Image();
// favImg.src = "icon-1.png";
// favImg.width = 19;
// favImg.height = 19;
// document.body.appendChild(favImg);
// var favedImg = new Image();
// favedImg.width = 19;
// favedImg.height = 19;
// favedImg.src = "icon-1-faved.png";
// document.body.appendChild(favedImg);
// favImg.onload = function () {};

var setNormalIcon = function () {
  // ctx.clearRect(0,0, 64, 64)
  // ctx.drawImage(favImg,0,0,19,19)
  chrome.action.setIcon({
    path: {
      19: "icon.png",
      38: "icon.png",
    },
  });
  chrome.action.setTitle({ title: "点击收藏到本月文件夹" });
};
var setLikedIcon = function () {
  // ctx.clearRect(0,0, 64, 64)
  // ctx.drawImage(favedImg,0,0,19,19)
  chrome.action.setIcon({
    path: {
      19: "icon-faved.png",
      38: "icon-faved.png",
    },
  });
  chrome.action.setTitle({ title: "已经收藏过此页面" });
  // canFav=0
};
function handleBookmarkChange(url) {
  chrome.bookmarks.search(url, function (list) {
    changeIcon(list && list.length)
  })
}
function changeIcon(flag) {
  if (flag) {
    setLikedIcon()
    canFav = 0
  } else {
    setNormalIcon()
    canFav = 1
  }
}
chrome.bookmarks.onRemoved.addListener(function (id, removeInfo) {
  // console.log('removeinfo', removeInfo)
  // currentTabId
  chrome.tabs.get(currentTabId, function (tab) {
    // console.log('after remove currentTab', tab)
    handleBookmarkChange(tab.url)
  })
})
chrome.bookmarks.onChanged.addListener(function (id, changeInfo) {
  // console.log('change', id, changeInfo)
  handleBookmarkChange(changeInfo.url)
});
chrome.tabs.onActivated.addListener(function (activeInfo) {
  currentTabId = activeInfo.tabId;
  // console.log('active current', currentTab)
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    handleBookmarkChange(tab.url)
  });
});
chrome.tabs.onCreated.addListener(function (tab) {
  currentTabId = tab.id
  // console.log('create current', currentTab)
  handleBookmarkChange(tab.url)
});
/**
 * 创建 年份-月份 文件夹
 * @param {string} yearId 年份文件夹id
 * @param {string} nowMonth 年份-月份 信息
 * @param {object} tab 需要收藏的当前标签页
 */
function createYearMonthFolder(yearId, nowMonth, tab) {
  // console.log(yearId);
  chrome.bookmarks.create(
    {
      index: 0,
      title: nowMonth,
      parentId: yearId,
    },
    function (monthNode) {
      createBookmark(monthNode.id, tab);
    }
  );
}
/**
 * 创建书签
 * @param {string} monthId 年份-月份 文件夹id
 * @param {object} tab 需要收藏的当前标签页
 */
function createBookmark(monthId, tab) {
  chrome.bookmarks.create(
    {
      index: 0,
      title: tab.title,
      url: tab.url,
      parentId: monthId,
    },
    function () {
      setLikedIcon();
    }
  );
}
chrome.action.onClicked.addListener(function (tab) {
  if (!canFav) return;
  var nowYear = getYear();
  var nowMonth = getMonth();
  chrome.bookmarks.get("1", function (root) {
    if (root.length) {
      chrome.bookmarks.search(nowMonth, function (list) {
        var monthId = null;
        var yearId = null;
        // 如果 year-month 日期文件夹存在，就将该 文件夹id 赋值给 id 变量
        if (list) {
          list.forEach(function (item) {
            if (item.title == nowMonth) {
              monthId = item.id;
            }
          });
        }
        // 年份-月份 文件夹不存在
        if (!list || monthId === null) {
          // 判断 年份 文件夹是否存在
          chrome.bookmarks.search(nowYear, function (marks) {
            if (marks) {
              marks.forEach(function (mark) {
                if (mark.title == nowYear) {
                  yearId = mark.id;
                }
              });
            }

            // 年份 文件夹不存在
            if (!marks || yearId == null) {
              // 创建年份文件夹
              chrome.bookmarks.create(
                {
                  index: 0,
                  title: nowYear,
                  parentId: root[0].id,
                },
                function (yearNode) {
                  createYearMonthFolder(yearNode.id, nowMonth, tab);
                }
              );
            } else {
              // 年份 文件夹存在
              createYearMonthFolder(yearId, nowMonth, tab);
            }
          });
        } else {
          // 年份-月份 文件夹存在
          createBookmark(monthId, tab);
        }
      });
    }
  });
});
