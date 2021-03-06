!function () {
    "use strict";
    function e(e) {
        return function (t) {
            return t ? e.sessionStorage.preferences ? (t = moment(t).tz(JSON.parse(e.sessionStorage.preferences).zone), moment(t).fromNow()) : void 0 : "-"
        }
    }

    function t(e) {
        return function (t) {
            if (e.sessionStorage.preferences) {
                if (!t)return "-";
                var n = JSON.parse(e.sessionStorage.preferences);
                return moment(t).tz(n.zone).format(n.dateFormat)
            }
        }
    }

    function r(e, t) {
        return function (n, r) {
            if (e.sessionStorage.preferences) {
                if (!n || !r)return "-";
                var o = JSON.parse(e.sessionStorage.preferences);
                n = moment(n).tz(o.zone), r = moment(r).tz(o.zone);
                var i = moment(r).diff(n);
                if (i >= 1e3) {
                    var a = parseInt(i / 1e3 % 60), s = parseInt(i / 6e4 % 60), f = parseInt(i / 36e5 % 24), u = parseInt(i / 864e5);
                    return 0 == u && 0 != f ? f + "h " + s + "m " + a + "s" : 0 == f && 0 != s ? s + "m " + a + "s" : 0 == u && 0 == f && 0 == s ? a + " sec" : u + "d " + f + "h " + s + "m " + a + "s"
                }
                return t.getString("label.lessThanSec")
            }
        }
    }

    function o() {
        return function (e) {
            var t = parseInt(e % 60), n = parseInt(e / 60 % 60), r = parseInt(e / 3600 % 24);
            return r = r > 9 ? r : "0" + r, n = n > 9 ? n : "0" + n, t = t > 9 ? t : "0" + t, r + ":" + n + ":" + t
        }
    }

    function i(e, t) {
        return function (n, r) {
            if (n || (n = new Date), r || (r = new Date), e.sessionStorage.preferences) {
                var o = JSON.parse(e.sessionStorage.preferences);
                n = moment(n).tz(o.zone), r = moment(r).tz(o.zone);
                var i = Math.abs(moment(r).diff(n));
                if (i >= 1e3) {
                    var a = parseInt(i / 1e3 % 60), s = parseInt(i / 6e4 % 60), f = parseInt(i / 36e5 % 24), u = parseInt(i / 864e5);
                    a = a>9 ? a : '0'+a;
                    s = s>9 ? s : '0'+s;
                    f = f>9 ? f : '0'+f;
                    return 0 == u && 0 != f ? f + ":" + s +":" + a + "h" : 0 == f && 0 != s ? s + ":" + a + "min" : 0 == u && 0 == f && 0 == s ? a + "sec" : u > 1 ? u + "days" : u + "day"
                }
                return t.getString("never")
            }
        }
    }

    function a() {
        return function (e, t) {
            return e ? e.slice(t) : void 0
        }
    }

    function s(e) {
        return function (t) {
            if (e.sessionStorage.preferences) {
                var n = new Date, r = JSON.parse(e.sessionStorage.preferences);
                t = moment(t).tz(r.zone), n = moment(n).tz(r.zone);
                var o = Math.abs(moment(n).diff(t));
                if (o >= 1e3) {
                    var i = parseInt(o / 1e3 % 60), a = parseInt(o / 6e4 % 60), s = parseInt(o / 36e5 % 24), f = parseInt(o / 864e5);
                    i = i>9 ? i : '0'+i;
                    a = a>9 ? a : '0'+a;
                    s = s>9 ? s : '0'+s;
                    return 0 == f && 0 != s ? s + ":" + a +":" + i + "h" : 0 == s && 0 != a ? a + ":" + i + "min" : 0 == f && 0 == s && 0 == a ? i + "sec" : f > 1 ? f + "days" : f + "day"
                }
                return "1sec"
            }
        }
    }

    function f(e) {
        return function (t) {
            if (t) {
                var n = t, r = (new Date).getTime(), o = r - n, i = Math.floor(o / 1e3), a = Math.floor(i / 60), s = Math.floor(a / 60), f = Math.floor(s / 24);
                return f > 1 ? f + " " + e.getString("label.dayAgo") : 1 == f ? "1 " + e.getString("label.dayAgo") : s > 1 ? s + " " + e.getString("label.hourAgo") : 1 == s ? e.getString("label.anHourAgo") : a > 1 ? a + " " + e.getString("label.minuteAgo") : 1 == a ? e.getString("label.aMinuteAgo") : e.getString("label.fewSecondsAgo")
            }
        }
    }

    angular.module("app").filter("fromNow", e).filter("stringToDate", t).filter("duration", r).filter("convertTime", o).filter("durationFromCurrent", i).filter("startFrom", a).filter("remainingTime", s).filter("timeDifferenceFilter", f), e.$inject = ["$window"], t.$inject = ["$window"], r.$inject = ["$window", "gettextCatalog"], i.$inject = ["$window", "gettextCatalog"], s.$inject = ["$window"], f.$inject = ["gettextCatalog"]
}();
