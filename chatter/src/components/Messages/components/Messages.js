import React, { useContext } from "react";
import io from "socket.io-client";
import useSound from "use-sound";
import INITIAL_BOTTY_MESSAGE from "../../../common/constants/initialBottyMessage";
import config from "../../../config";
import LatestMessagesContext from "../../../contexts/LatestMessages/LatestMessages";
import "../styles/_messages.scss";
import Footer from "./Footer";
import Header from "./Header";
import Message from "./Message";
import TypingMessage from "./TypingMessage";

const socket = io(config.BOT_SERVER_ENDPOINT, {
  transports: ["websocket", "polling", "flashsocket"],
});

const ME = "me";
const BOT = "bot";

//Declare initial message to feed in when page renders as initilat state
const INITIAL_MESSAGE = {
  message: INITIAL_BOTTY_MESSAGE,
  id: Date.now(),
  user: BOT,
};

function Messages() {
  const [messages, setMessages] = React.useState([INITIAL_MESSAGE]);
  const [message, setMessage] = React.useState("");
  const [isBotTyping, setisBotTyping] = React.useState(false);
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);

  //handles recieve bot-message event
  React.useEffect(() => {
    socket.on("bot-message", (message) => {
      setisBotTyping(false);
      setMessages([...messages, { message, user: BOT, id: Date.now() }]);
      setLatestMessage(BOT, message);
      playReceive();
      //todo:- Scroll on message recieve
    });

    // the listeners must be removed in the cleanup step, in order to prevent multiple event registrations
    return () => {
      socket.off("bot-message");
    };
  }, [messages, playReceive, setLatestMessage]);

  // Handles bot-typing events recieved from sockets
  React.useEffect(() => {
    document.getElementById("user-message-input").focus();
    socket.on("bot-typing", () => {
      setisBotTyping(true);
    });

    // the listeners must be removed in the cleanup step, in order to prevent multiple event registrations
    return () => {
      socket.off("bot-typing");
    };
  }, []);

  // The useCallback Hook only runs when one of its dependencies update. This is used to improve performance.
  const sendMessage = React.useCallback(() => {
    if (!message) return;
    setMessages([...messages, { message, user: ME, id: Date.now() }]);
    //Play sound for sending message
    playSend();
    // Emit the event "user-message" when
    socket.emit("user-message", message);
    setMessage("");
    document.getElementById("user-message-input").value = "";
  }, [message, messages, playSend]);

  //Sets the message state on change in message input field
  const handleChange = (e) => {
    setMessage(e.target.value);
  };
  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messages.map((message, index) => (
          <Message
            message={message}
            nextMessage={messages[index + 1]}
            isBotTyping={isBotTyping}
          />
        ))}
        {isBotTyping && <TypingMessage />}
      </div>
      <Footer
        message={message}
        sendMessage={sendMessage}
        onChangeMessage={handleChange}
      />
    </div>
  );
}

export default Messages;
