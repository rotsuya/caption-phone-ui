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
     * @param pageName ページ名を 'chat' か 'dial' で指定します。
     */
    showPage: function(pageName) {
        switch (pageName) {
            case 'chat':
                $('html').removeClass('showing-dial-page').addClass('showing-chat-page');
                break;
            case 'dial':
                $('html').removeClass('showing-chat-page').addClass('showing-dial-page');
                break;
        }
    },

    /**
     * モーダルダイアログを表示、非表示にするメソッドです。
     * @param [modalName] モーダルの種類を 'incoming' と指定します。
     * 引数なしで呼び出すとモーダルを非表示にします。
     */
    showModal: function(modalName) {
        switch (modalName) {
            case 'incoming':
                $('#incomingModal').show();
                // 同一スレッドで実行するとトランジションのアニメーションが描画されないので、
                // 別スレッドで非同期に実行する。
                setTimeout(function(){
                    $('html').addClass('showing-incoming-modal');
                }, 0);
                break;
            default:
                $('html').removeClass('showing-incoming-modal');
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
        var $chatContainer = $('#chatContainer');
        var totalHeight = $chatContainer.get(0).scrollHeight;
        var visibleHeight = $chatContainer.get(0).clientHeight;
        $chatContainer.scrollTop(totalHeight - visibleHeight);
    },

    /**
     * 接続状態を変更するメソッドです。
     * @param state 状態を 'online' か 'offline' で指定します。
     * @param [yourId] WebSocketサーバに接続した時の自分のIDを指定します。state が 'online' の時は必須。
     */
    changeServiceState: function(state, yourId) {
        switch (state) {
            case 'online':
                $('html').removeClass('offline').addClass('online');
                $('#yourId').text(ui._formatId(yourId));
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
    },

    /**
     * IDの表示形式を、4桁ごとにスペースを入た、0000 0000 0000形式に整形します。
     */
    _formatId: function (id) {
        id = id
            .replace(/[^0-9]/g, '')
            .slice(0, 12)
            .replace(/([0-9]{4})/g, '$1 ')
            .trim();
        return id;
    }
};

/**
 * 初期化処理の関数です。<body> の最後で実行するのですべての DOM にアクセスできるはず。
 * DOM が見つからないというエラーが発生する時は、$(document).on('ready', function() {...}) に書き換えること。
 */
(function() {
    $(window).on('load', function() {
        ui.scrollToBottom();
    });

    setTimeout(function() {
        // WebSocketに接続したら実行してください。
        // ここでは setTimeout の中に書きます。
        ui.changeServiceState('online', '123456789012');
    }, 1000);

    // click イベントは、タッチデバイスで使用すると hold 等の判定のため 0.3 sec の遅延が入り、体感速度が低下する。
    // touchstart や touchend で代用すると体感速度が向上したが、スクロール時にタップを認識するなどの誤判定が発生した。
    // hammer.js ライブラリを導入し、tap イベントを使うことにした。

    $('button')
        .hammer({drag: false, hold: false, prevent_default: false, swipe: false, touch: false, transform: false})
        .on('tap', function() {
            var thisId = $(this).attr('id');
            var $anotherId = $('#anotherId');
            switch (thisId) {
                case 'dialButton':
                    ui.showPage('dial');
                    break;
                case 'disconnectButton':
                    ui.changePhoneState('disconnected');
                    break;
                case 'backButton':
                    ui.showPage('chat');
                    ui.scrollToBottom();
                    break;
                case 'backSpaceButton':
                    var id = $anotherId.val();
                    id = ui._formatId(id.slice(0, -1));
                    $anotherId.val(id);
                    break;
                case 'clearButton':
                    $anotherId.val('');
                    break;
                case 'callButton':
                    var id = $anotherId.val().replace(/\s/g, '');
                    console.log(id); // replace with calling procedure.
                    ui.showPage('chat');
                    ui.scrollToBottom();
                    ui.changePhoneState('connected');
                    break;
                case 'rejectButton':
                    ui.showModal();
                    break;
                case 'acceptButton':
                    ui.showModal();
                    ui.showPage('chat');
                    ui.scrollToBottom();
                    ui.changePhoneState('connected');
                    break;
                default:
                    if ($(this).hasClass('number-button')) {
                        var number = $(this).text();
                        $anotherId.val(ui._formatId($anotherId.val() + number));
                    }
                    break;
            }
    });

    $('#anotherId').on('change', function() {
        var $anotherId = $('#anotherId');
        $anotherId.val(ui._formatId($anotherId.val()));
    });

    // body { overflow: hidden } を設定しているにもかかわらず、Chromeでスクロールできてしまう不具合に対処
    $(window)
        .on('scroll', function() {
            $(this).scrollTop(0).scrollLeft(0);
    });
})();