// Global Page Ready Functions
var config = { api_url: "http://123.57.207.201:8080/" };
localStorage.setItem('config', JSON.stringify(config));
var user   = JSON.parse(localStorage.getItem('user'));

// Global Page before show functions
$(document).on('pagebeforeshow', function() {
    // Handling navbar related logic
	$("[data-role='navbar']").navbar();
    $("[data-role='header'], [data-role='footer']").toolbar();
    var id = $.mobile.activePage.attr('id');
    $("#nav-footer li a").removeClass("ui-btn-now");
    if (id == "index-page") $("#nav-footer [data-icon='home']").addClass("ui-btn-now");
    if (id == "user-page") $("#nav-footer [data-icon='user']").addClass("ui-btn-now");
    if (id == "about-page") $("#nav-footer [data-icon='info']").addClass("ui-btn-now");
    if (id == "setting-page") $("#nav-footer [data-icon='gear']").addClass("ui-btn-now");
});

/*
$(document).on('pagebeforechange', function(e, data){  
    var to = data.toPage, from = data.options.fromPage;
    if (typeof to  === 'string') {
        var u = $.mobile.path.parseUrl(to);
        to = u.pathname;
        if (user == null) {
            if (to.endWith("user.html")) {
                redirect_to("signin.html");
            }
        }
    }
});
*/

// user.html
$('#user-page').on('pageinit', function() {
    if (user == null) {
        redirect_to("signin.html");
        return;
    }
    if (user_loaded()) {
        Tempo.prepare("user-info").render(user);
    } else {
        $.ajax({
            type: 'GET',
          url: config.api_url + "api/account",
          beforeSend: function (request) {
              request.setRequestHeader("Authorization", "Bearer " + user.access_token);
          },
          success: function(data) {
                       if (data.message = "OK") {
                           $.extend(user, data);
                           user.avatar = config.api_url + user.avatar;
                           localStorage.setItem('user', JSON.stringify(user));
                           Tempo.prepare("user-info").render(user);
                       } else {
                           alert("验证失败，请重新登录");
                           redirect_to("signin.html");
                       }
                   },
          error: function(data) {
                     $("#error").html("* 用户名密码错误");
                     $("#error").show();
                 }
        });    
    }
});


// signin.html
$('#signin-page').on('pageinit', function() {
    var user = {};
    $("#submit-signin").click(function(){
        $.ajax({
            type: 'POST',
            url: config.api_url + "oauth/token",
            data: $("#signin-form").serialize(),
            success: function(data) {
                if (data.access_token != null) {
                    hide_common_error();
                    user.access_token = data.access_token;
                    localStorage.setItem('user', JSON.stringify(user));
                    redirect_to("index.html");
                } else {
                    show_common_error(data.message);
                }
            },
            error: function(data) {
                       show_common_error("* 用户名密码错误");
                   }
        });
    });
});

// setting.html
$('#setting-page').on('pagebeforeshow', function() {
    if (user == null) {
        redirect_to("signin.html");
        return;
    }
    $("#signout-btn").click(function(){
        localStorage.removeItem('user');
        redirect_to("signin.html");
    });
});   

$('#choose-date-page').on('pageinit', function() {
    bindAble();
    bindSelected();
});
$('#set-date-page').on('pageinit', function() {
    bindSetEmpty();
    bindSetAble();
});

$('#set-keywords-page').on('pageinit', function() {
    $('#tags').tagsInput();
});

function bindAble()
{
    $(".reserve-table .able").click(function(){
        $(this).removeClass("able").addClass("selected");
        bindSelected();
    });
}
function bindSelected()
{
    $(".reserve-table .selected").click(function(){
        $(this).removeClass("selected").addClass("able");
        bindAble();
    });
}

function bindSetEmpty()
{
    $(".reserve-table .able").click(function(){
        $(this).removeClass("able").addClass("empty");
        bindSetAble();
    });
}
function bindSetAble()
{
    $(".reserve-table .empty").click(function(){
        $(this).removeClass("empty").addClass("able");
        bindSetEmpty();
    });
}

function user_loaded() {
    return user.username != null;
}

function show_common_error(error) {
    $("#error").html(error);
    $("#error").show();
}

function hide_common_error(error) {
    $("#error").html('');
    $("#error").hide();
}

function redirect_to(page) {
    $( ":mobile-pagecontainer" ).pagecontainer( "change", page, { role: "page" } );
}

function getParameter(name) {
    var url = document.location.href;
    var start = url.indexOf("?")+1;
    if (start==0) {
        return "";
    }
    var value = "";
    var queryString = url.substring(start);
    var paraNames = queryString.split("&");
    for (var i=0; i<paraNames.length; i++) {
        if (name==getParameterName(paraNames[i])) {
            value = getParameterValue(paraNames[i])
        }
    }
    return value;
}

function getParameterName(str) {
    var start = str.indexOf("=");
    if (start==-1) {
        return str;
    }
    return str.substring(0,start);
}

function getParameterValue(str) {
    var start = str.indexOf("=");
    if (start==-1) {
        return "";
    }
    return str.substring(start+1);
}

String.prototype.endWith = function (subStr) {
    if (subStr.length > this.length) {
        return false;
    }
    else {
        return (this.lastIndexOf(subStr) == (this.length - subStr.length)) ? true : false;
    }
}
