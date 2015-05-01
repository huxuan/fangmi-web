// signin.html 
$('#signin-page').on('pageinit', function() {
    var signin_succ = function(data) {
        hide_loading();
        if (data.message = 'OK') {
            $.extend(user, data.user);
            user.avatar = config.api_url + user.avatar;
            localStorage.setItem('user', JSON.stringify(user));
            redirect_to("index.html");
        } else {
            redirect_to("signin.html");
        }   
    }
    var signin_fail = function(data) { 
        show_common_error("用户名密码错误"); 
        hide_loading();
    }


    $("#submit-signin").click(function(){
        show_loading();
        $.ajax({
            type: 'POST',
            url: config.api_url + "oauth/token",
            data: $("#signin-form").serialize(),
            success: function(data) {
                if (data.access_token != null) {
                    user = {};
                    hide_common_error();
                    console.log(data);
                    user.access_token = data.access_token;
                    get_with_auth("api/account", signin_succ, signin_fail);
                } else {
                    show_common_error("验证错误");
                    hide_loading();
                }
            }, 
            error: server_err_fn
        });
    });
});


// user.html
$('#user-page').on('pagebeforeshow', function() {
    if (user == null || user.username == null) {
        redirect_to("signin.html");
        return;
    }
    element = "user-info";
    $("#" + element).hide();
    show_loading();
    get_with_auth("api/account", function(data) {
        if (data.message = 'OK') {
            $.extend(user, data.user);
            user.avatar = config.api_url + user.avatar;
            localStorage.setItem('user', JSON.stringify(user));
            tempo_show(element, user);
        } else {
            hide_loading();
            redirect_to("signin.html");
        }   
    }, server_err_redirect_fn);
});
      
// edit_profile.html
$('#edit-profile-page').on('pagebeforeshow', function() {
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

    if (!user_loaded()) {
        redirect_to("signin.html");
        return;
    }
    set_user_data(user);

    $("#submit_edit_profile").unbind().click(function(){
        post_with_data_auth("api/account", $("#edit-profile-form").serialize(),
            function(data) {
                if (data.status == 200 && data.message == 'OK') {
                    $.extend(user, data.user);
                    user.avatar = config.api_url + user.avatar;
                    localStorage.setItem('user', JSON.stringify(user));
                    show_common_error("信息保存成功");
                } else  show_common_error(data.message); 
            }, server_err_redirect_fn);
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
$('#apply-confirm-page').on('pagebeforeshow', function() {
    user_post({
        button: "#submit-apply-confirm",
        form:   "#apply-confirm-form",
        api:    "api/account/apply/confirmed",
        message: "审核申请发送成功，请耐心等待审核." 
    });
});

// check_student.html
$('#apply-student-page').on('pagebeforeshow', function() {
    $(':file').change(function(){
        var file = this.files[0];
        var name = file.name;
        var size = file.size;
        var type = file.type;
        // TODO add validation
    });

    $("#submit-apply-student").unbind().click(function() {
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
            beforeSend: function (request) { request.setRequestHeader("Authorization", "Bearer " + user.access_token); },
            success: function(data) {
                console.log(data);
                if (data.status_code == 200 && data.message == 'OK') show_common_error("审核学生信息申请发送成功，请耐心等待审核."); 
                else  show_common_error(data.message);
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
$('#signup-page').on('pagebeforeshow', function() {
    set_captcha_elements();
    $("#submit-signup").click(function(){
        $.ajax({
            type: 'POST',
            url: config.api_url + "api/account/register",
            data: $("#signup-form").serialize(),
            success: function(data) {
                if (data.message == 'OK') {
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
    if (user == null || user.username == null) {
        hide_loading();
        redirect_to("signin.html");
        return;
    }
    element = "user-setting-info";
    $("#" + element).hide();
    show_loading();
    get_with_auth("api/account", function(data) {
        if (data.message == 'OK') {
            $.extend(user, data.user);
            user.avatar = config.api_url + user.avatar;
            localStorage.setItem('user', JSON.stringify(user));

            Tempo.prepare(element).when(TempoEvent.Types.RENDER_COMPLETE, function() {
                $("#" + element).show();
                hide_loading();

                // bind events
                $("#signout-btn").unbind().click(function(){
                    console.log("here");
                    if (user != null) localStorage.removeItem('user');
                    if (whole_house != null) localStorage.removeItem('whole_house');
                    if (single_house != null) localStorage.removeItem('single_house');
                    redirect_to("signin.html");
                });      
            }).render(user);
        } else {
            hide_loading();
            redirect_to("signin.html");
        }
    }, server_err_redirect_fn);
});
 
// forget_password.html
$('#forget-password-page').on('pagebeforeshow', function() {
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

