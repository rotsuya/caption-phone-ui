/**
 * @fileoverview UIを操作するためのサンプルコードです。

 * @author r.otsuya@ntt.com(Ryosuke Otsuya)
 */

/**
 * UIを操作するメソッドを入れる、名前空間です。
 */
var ui = {
    /**
     * ページを切り替えるメソッドです。
     * @param pageName ページ名を 'list' か 'chat' で指定します。
     */
    showPage: function(pageName) {
        switch (pageName) {
            case 'list':
                $('html').removeClass('showing-chat-page').addClass('showing-list-page');
                break;
            case 'chat':
                $('html').removeClass('showing-list-page').addClass('showing-chat-page');
                break;
        }
    },

    /**
     * モーダルダイアログを表示、非表示にするメソッドです。
     * @param modalName モーダルの種類を 'login' か 'incoming' で指定します。
     * 引数なしで呼び出すとモーダルを非表示にします。
     */
    showModal: function(modalName) {
        switch (modalName) {
            case 'login':
                $('#loginModal').show();
                // 同一スレッドで実行するとトランジションのアニメーションが描画されないので、
                // 別スレッドで非同期に実行する。
                setTimeout(function(){
                    $('html').removeClass('showing-incoming-modal').addClass('showing-login-modal');
                }, 0);
                break;
            case 'incoming':
                $('#incomingModal').show();
                // 同一スレッドで実行するとトランジションのアニメーションが描画されないので、
                // 別スレッドで非同期に実行する。
                setTimeout(function(){
                    $('html').removeClass('showing-login-modal').addClass('showing-incoming-modal');
                }, 0);
                break;
            default:
                $('html').removeClass('showing-login-modal showing-incoming-modal');
                // transform: translateZ() だけでモーダルを非表示にすると、<body> に overflow: hidden を
                // 適用しているのにも関わらずスクロールできてしまうという、WebKitのバグが存在することがわかった。
                // バグに対処するため、モーダルが非表示のときは .hide() を使って display: none を設定する。
                // 本来は transitionEnd イベントが発生した時に実行すべきだが、
                // 簡略化して、0.21 sec 後にタイマーで実行する。(0.01 sec はバッファ。)
                setTimeout(function(){
                    $('.modal').hide();
                }, 210);
                break;
        }
    },

    /**
     * チャットページの一番下までスクロールするメソッドです。
     */
    scrollToBottom: function() {
        var totalHeight = $('#chatContainer').get(0).scrollHeight;
        var visibleHeight = $('#chatContainer').get(0).clientHeight;
        $('#chatContainer').scrollTop(totalHeight - visibleHeight);
    },

    /**
     * 接続状態を変更するメソッドです。今のところ使っていません。
     * @param state 状態を 'online' か 'offline' で指定します。
     */
    changeServiceState: function(state) {
        switch (state) {
            case 'online':
                $('html').removeClass('offline').addClass('online');
                break;
            case 'offline':
                $('html').removeClass('online').addClass('offline');
                break;
        }
    },

    /**
     * 通話状態を変更するメソッドです。ボタンの種類などが切り替わります。
     * @param state 状態を 'connected' か 'disconnected' で指定します。
     */
    changePhoneState: function(state) {
        switch (state) {
            case 'connected':
                $('html').removeClass('disconnected').addClass('connected');
                break;
            case 'disconnected':
                $('html').removeClass('connected').addClass('disconnected');
                break;
        }
    }
};

/**
 * 初期化処理の関数です。<body> の最後で実行するのですべての DOM にアクセスできるはず。
 * DOM が見つからないというエラーが発生する時は、$(document).on('ready', function() {...}) に書き換えること。
 */
(function() {
    $(window).on('load', function() {
        ui.showModal('login');
    });

    // click イベントは、タッチデバイスで使用すると hold 等の判定のため 0.3 sec の遅延が入り、体感速度が低下する。
    // touchstart や touchend で代用すると体感速度が向上したが、スクロール時にタップを認識するなどの誤判定が発生した。
    // hammer.js ライブラリを導入し、tap イベントを使うことにした。
    $('#userList')
        .hammer({drag: false, hold: false, prevent_default: false, swipe: false, touch: false, transform: false})
        .on('tap', 'li', function(event) {
            var username = $(this).data('username');
            console.log('リスト ' + username + ' がクリックされた');
            // .scrollToBottom() → .showPage() の順だと、ページの一番下よりも少し上に
            // スクロールしてしまう Chrome のバグを発見したため、順番を入れ替えた。
            ui.showPage('chat');
            ui.scrollToBottom();
    });

    $('button')
        .hammer({drag: false, hold: false, prevent_default: false, swipe: false, touch: false, transform: false})
        .on('tap', function(event) {
            var id = $(this).attr('id');
            console.log('ボタン ' + id + ' がクリックされた');
            switch (id) {
                case 'backButton':
                    ui.showPage('list');
                    break;
                case 'cancelButton':
                    ui.showModal('');
                    break;
                case 'okButton':
                    ui.showModal('');
                    break;
            }
    });

    // body { overflow: hidden } を設定しているにもかかわらず、Chromeでスクロールできてしまう不具合に対処
    $(window)
        .on('scroll', function() {
            console.log('scroll to origin.')
            $(this).scrollTop(0).scrollLeft(0);
        });
})();