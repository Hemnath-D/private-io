import React, { Component } from 'react';
import { render } from 'react-dom';
import ChatApp from './components/ChatApp.jsx';
import Cover from './components/Cover.jsx';
import ReactEmoji from 'react-emoji';

class App extends Component {
  componentDidMount() {
    const socket = io();
    // exposing the socket globally.
    window.socket = socket;
    socket.on('connect', () => {
      this.setState({ connectedToServer: true });
      console.log('Connected to server');
      socket.on('UserData', (users) => {
        this.setState({ users });
      });

      socket.on('NewUserList', (usersList) => {
        const filteredUsersList = usersList.list.filter((user) => user.username !== this.state.activeUser);
        this.setState({ users: filteredUsersList });
      });


      socket.on('NewMessage', (thread) => {
        // parse the emojis 
        thread.text = ReactEmoji.emojify(thread.text);

        const fromUser = thread.from;
        const toUser = thread.to;
        const roomName = toUser + fromUser;

        // search for chat room in state.rooms
        const findRoom = this.state.rooms[roomName];

        if (typeof findRoom !== 'undefined') {
          // add threads in the room 
          this.setState({ rooms: [thread, ...this.state.rooms[roomName]] });
          // add new thread with old threads 
          const chats = [thread, ...this.state.rooms[roomName]];
          this.setState({ messages: chats });
        }
        else {
          const newThreads = [...this.state.messages, thread];
          this.setState({ messages: newThreads });
        }
      });

      socket.on('disconnect', () => {
        this.setState({ connectedToServer: false });
        console.log('Disconnected from server');
      });
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      connectedToServer: false,
      users: [],
      messages: [],
      rooms: [],
      activeUser: '',
      chattingWith: 'Choose user to chat with',
      isSubmitted: false
    }
  }

  _addNewUser(username) {
    username = username.charAt(0).toUpperCase() + username.slice(1);
    const user = { username };

    const currentUsers = this.state.users;
    const checkUsername = currentUsers.find((user) => user.username === username);

    if (typeof checkUsername !== 'undefined') {
      return alert('Username Taken');
    }

    if (this.state.connectedToServer) {
      socket.emit('NewUser', { username });
      this.setState({
        isSubmitted: true,
        activeUser: username
      });
    }
    else if (!this.state.connectedToServer) {
      //TODO flash a toaster
      alert('No connection to server, Please Refresh');
    }
  }

  _selectUserForChat(username) {
    /**
     * Make a unique string with username + activeuser
     * make room using that string
     * store messages of both users in that room 
     */
    const roomName = username + this.state.activeUser;
    let rooms = null;

    // find roomName if exists
    const checkRoom = this.state.rooms[roomName];

    if (typeof checkRoom !== 'undefined') {
      console.log('selec room old chats: => ', checkRoom);
    }
    else {
      /**
       * if failed to find room, create a room 
       * and  store in state.rooms
       */

      rooms = [];
      rooms[roomName];

      this.setState({
        rooms,
        messages: []
      });
    }

    this.setState({ chattingWith: username });
  }

  _sendMessage(message) {
    // const newMessages = [...this.state.messages];
    // newMessages.push(message);
    // this.setState({messages: newMessages});
    if (this.state.connectedToServer) {
      const thread = {
        ...message,
        to: this.state.chattingWith
      }

      if (thread.to === 'Choose user to chat with') {
        return alert('Chooose a person to chat with');
      }

      socket.emit('MessageCreated', thread);
    }
    else {
      return alert('No connection!');
    }
  }

  render() {
    console.log(this, "app")
    if (this.state.isSubmitted) {
      return (
        <ChatApp
          {...this.state}
          selectUserForChat={this._selectUserForChat.bind(this)}
          sendMessage={this._sendMessage.bind(this)}
        />
      );
    }

    return (
      <Cover addUser={this._addNewUser.bind(this)} />
    )
  }
}

render(<App />, document.getElementById('app'));