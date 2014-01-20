/// <reference path="../d.ts/DefinitelyTyped/jquery/jquery.d.ts" />
/// <reference path="../d.ts/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="../d.ts/chat.d.ts" />

module Chat {

    export interface Scope extends ng.IScope {
        roomId: number
        userId: number
        messages: Array<any>
        talkBody: String
        talk: (KeyboardEvent) => void
    }
    export class Controller {
        constructor($scope:Scope, $http:ng.IHttpService) {
            $scope.messages = []
            $http.get("/recently_messages/" + $scope.roomId).success((result) => {
                result.reverse().forEach((message) => {
                    $scope.messages.push(message)
                })
            })

            $http.get("/room/" + $scope.roomId + "/" + $scope.userId + "/wspath").success((result) => {
                var WS = window['MozWebSocket'] ? MozWebSocket : WebSocket
                var chatSocket = new WS(result.path)

                $scope.talk = (e:KeyboardEvent) => {
                    if (e.charCode == 13 || e.keyCode == 13) {
                        e.preventDefault()
                        chatSocket.send(JSON.stringify(
                            {text: $scope.talkBody}
                        ))
                        $scope.talkBody = ""
                    }
                }

                chatSocket.onmessage = (event) => {
                    var data:Message = JSON.parse(event.data)

                    // Handle errors
                    if (data.error) {
                        chatSocket.close()
                        $("#onError span").text(data.error)
                        $("#onError").show()
                        return
                    } else {
                        $("#onChat").show()
                    }

                    // Create the message element
                    var el = $('<div class="message"><img class="avatar" /><span></span><p></p></div>')
                    var user = data.members.filter((member:Member) => {
                        return member.id == data.user
                    })[0];
                    $("img", el).attr("src", user.avatar)
                    $("span", el).text(user.name)
                    $("p", el).text(data.message)
                    $(el).addClass(data.kind)
                    if (data.user == $scope.userId) $(el).addClass('me')
                    $('#messages').append(el)

                    // Update the members list
                    $("#members").html('')
                    data.members.forEach((member:Member) => {
                        var li = $('<li><img class="avatar" /><span></span></li>');
                        $("img", li).attr("src", member.avatar)
                        $("span", li).text(member.name)
                        $("#members").append(li);
                    })
                }
            })
        }
    }
}