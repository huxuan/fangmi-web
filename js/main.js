// Global Page Ready Functions
var config = { api_url: "http://123.57.207.201:8080/" };
localStorage.setItem('config', JSON.stringify(config));
var user   = JSON.parse(localStorage.getItem('user'));
var server_err_fn = function(data) { 
    show_common_error("服务器错误，请稍后再试。"); 
    console.log(data);
};
var whole_house = JSON.parse(localStorage.getItem('whole_house'));
if (whole_house == null) whole_house = {};

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
    user   = JSON.parse(localStorage.getItem('user'));
    if (user != null) {
        $(".ui-btn-signin").hide();
        $(".ui-btn-signup").hide();
    } else {
        $(".ui-btn-signin").show();
        $(".ui-btn-signup").show();
    }
    hide_common_error();
});

// user.html
$('#user-page').on('pagebeforeshow', function() {
    if (user == null) {
        redirect_to("signin.html");
        return;
    }
    if (user_loaded()) {
        Tempo.prepare("user-info").render(user);
    } else {
        load_user("user-info");
    }
});

$('#edit-profile-page').on('pageinit', function() {
    var set_user_data = function(user) {
        user.gender = user.gender ? 1 : 0;
        $("#gender").val(user.gender);
        $("#gender option[value='"+user.gender+"']").attr('selected', 'selected');
        $('#gender').selectmenu('refresh', true);
        $("#horoscope").val(user.horoscope);
        $("#horoscope option[value='"+user.horoscope+"']").attr('selected', 'selected');
        $('#horoscope').selectmenu('refresh', true);
        $("#nickname").val(user.nickname);
        $("#status").val(user.status);
    };

    if (user == null) {
        redirect_to("signin.html");
        return;
    }

    if (user_loaded() == false) {
        $.ajax( { 
            type: 'GET',
            url: config.api_url + "api/account",
            beforeSend: function (request) {
              request.setRequestHeader("Authorization", "Bearer " + user.access_token);
            },
          success: function(data) {
                       if (data.message = "OK") {
                           $.extend(user, data.user);
                           user.avatar = config.api_url + user.avatar;
                           localStorage.setItem('user', JSON.stringify(user));
                           set_user_data(user);
                       } else redirect_to("signin.html");
                   },
          error: function(data) { redirect_to("signin.html"); }
        });  
    } else {
        set_user_data(user);
    }

    $("#submit_edit_profile").click(function(){
        $.ajax({
            type: 'POST',
            beforeSend: function (request) {
                request.setRequestHeader("Authorization", "Bearer " + user.access_token);
            },
            url: config.api_url + "api/account",
            data: $("#edit-profile-form").serialize(),
            success: function(data) {
                if (data.message == "OK") {
                    $.extend(user, data.user);
                    user.avatar = config.api_url + user.avatar;
                    localStorage.setItem('user', JSON.stringify(user));
                    show_common_error("保存成功");
                } else  show_common_error(data.message); 
            },
            error: function(data) { redirect_to("signin.html"); }
        });                 
    });
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
            error: server_err_fn
        });
    });
});

// forget_password.html
$('#forget-password-page').on('pageinit', function() {
    set_captcha_elements();
    $("#submit-forget").click(function(){
        $.ajax({
            type: 'POST',
            url: config.api_url + "api/account/password/forget",
            data: $("#forget-password-form").serialize(),
            success: function(data) {
                if (data.message == 'OK') {
                    show_common_error("修改成功，您可以用新密码登录了.");
                } else {
                    show_common_error(data.message);
                }
            },
            error: server_err_fn
        });   

    });    
});


// change_password.html
$('#change-password-page').on('pageinit', function() {
    user_post({
        button: "#submit-change-password",
        form:   "#change-password-form",
        api:    "api/account/password/change",
        message: "修改成功，您可以用新密码登录了." 
    });   
});

// check_id.html
$('#apply-confirm-page').on('pageinit', function() {
    user_post({
        button: "#submit-apply-confirm",
        form:   "#apply-confirm-form",
        api:    "api/account/apply/confirmed",
        message: "审核申请发送成功，请耐心等待审核." 
    });
});

// check_student.html
$('#apply-student-page').on('pageinit', function() {
    $(':file').change(function(){
        var file = this.files[0];
        var name = file.name;
        var size = file.size;
        var type = file.type;
        // TODO add validation
    });
    function progressHandlingFunction(e){
        if(e.lengthComputable){
           $('progress').attr({value:e.loaded,max:e.total});
        }
    }
    
    $("#submit-apply-student").click(function() {
        var formData = new FormData($('#apply-student-form')[0]);
        console.log("start updaloding");
        $.ajax({
            url: config.api_url + "api/account/apply/student", 
            type: 'POST',
            xhr: function() {  
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){ 
                    console.log("updalod");
                    myXhr.upload.addEventListener('progress',progressHandlingFunction, false); 
                }
                return myXhr;
            },
            beforeSend: function (request) {
                console.log("before updalod");
                request.setRequestHeader("Authorization", "Bearer " + user.access_token);
            },
            success: function(data) {
                if (data.message = "OK") 
                    show_common_error("审核学生信息申请发送成功，请耐心等待审核."); 
                else  
                    show_common_error(data.message);
            },
            error: server_err_fn,
            data: formData,
            cache: false,
            contentType: false,
            processData: false
        });
    });
});



// signup.html
$('#signup-page').on('pageinit', function() {
    set_captcha_elements();
    $("#submit-signup").click(function(){
        $.ajax({
            type: 'POST',
            url: config.api_url + "api/account/register",
            data: $("#signup-form").serialize(),
            success: function(data) {
                if (data.message == 'OK') {
                    // TODO redirect to signup success page
                    show_common_error("注册成功，请登录.");
                } else {
                    show_common_error(data.message);
                }
            },
            error: function(data) { show_common_error('服务器错误'); }
        });   

    });
});

// setting.html
$('#setting-page').on('pagebeforeshow', function() {
    if (user == null) {
        redirect_to("signin.html");
        return;
    }
    if (user_loaded()) {
        Tempo.prepare("user-setting-info").render(user);
    } else {
        load_user("user-setting-info");
    }
    $("#signout-btn").unbind().click(function(){
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
    $('.input-tags').tagsInput();
});
$('#set-device-page').on('pageinit', function() {
    $("#set-device").click(function() {
        var devices = [];
        $('input[data-cacheval="false"]').each(function(index) {
            devices.push({
                name: $(this).attr("name"),
                count: 1
            });
        });
        whole_house["devices"] = devices;
        localStorage.setItem('whole_house', JSON.stringify(whole_house));
        // TODO read from url
        redirect_to("post_whole.html");
    });
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

function load_user(element) {
    $.ajax({
        type: 'GET',
    url: config.api_url + "api/account",
    beforeSend: function (request) {
        request.setRequestHeader("Authorization", "Bearer " + user.access_token);
    },
    success: function(data) {
                 if (data.message = "OK") {
                     $.extend(user, data.user);
                     user.avatar = config.api_url + user.avatar;
                     localStorage.setItem('user', JSON.stringify(user));
                     Tempo.prepare(element).render(user);
                 } else {
                     redirect_to("signin.html");
                 }
             },
    error: function(data) { show_common_error("用户名密码错误"); }
    });   
}


function user_post(pconfig) {
    $(pconfig.button).click(function(){
        $.ajax({
            type: 'POST',
        url: config.api_url + pconfig.api,
        beforeSend: function (request) {
            request.setRequestHeader("Authorization", "Bearer " + user.access_token);
        },
        data: $(pconfig.form).serialize(),
        success: function(data) {
            if (data.message == 'OK') {
                show_common_error(pconfig.message);
            } else {
                show_common_error(data.message);
            }
        },
        error: server_err_fn
        });   
    });    
}

function show_common_error(error) {
    $("#error").html(error);
    $("#error").show();
}

function hide_common_error(error) {
    $("#error").html('');
    $("#error").hide();
}

function set_captcha_elements() {
    var time = 60;
    var timer_id = setInterval(settime, 1000);
    $("#vcode-timer").html(time);
    clearInterval(timer_id);
    $("#vcode-timer").html("");
    $("#info").html("获取验证码");

    var enableButton = function(){ $("#go").button('enable'); }
    var settime = function(time){
        time = $("#vcode-timer").html();
        if(time == "") time = 60;
        time -= 1;
        $("#vcode-timer").html(time);
        $("#info").html("秒后重新获取");
        if(time > 0) {
        } else {
            time = 60;
            $("#vcode-timer").html(time);
            $("#go").button('enable');
            $("#go").attr('disabled',false);
            clearInterval(timer_id);
            $("#vcode-timer").html("");
            $("#info").html("获取验证码");
        }
    }

    $("#go").click(function(event){
        event.preventDefault();
        var $phone = $("#phone").val();
        if($phone == undefined || $phone.length != 11) {
            alert("手机号码应该为11位数字。" + $phone);
            return;
        }
        $("#go").attr('disabled',true);
        $("#submit-signup").attr('disabled', false);

        var minutes = 0.1;
        $("#go").attr("value", minutes);
        timer_id = setInterval(settime, 1000);

        // TODO send vcode request
    });          
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
