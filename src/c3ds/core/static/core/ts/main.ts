import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// const displaySlug = document.querySelector('body')?.dataset['displaySlug']

// Video Playback
const video_container = document.getElementById('video')
if (video_container !== null) {
  const video_src = video_container.dataset['src']
  const video_type = video_container.dataset['type']
  if (video_src !== undefined && video_type !== undefined) {
    const player = videojs(video_container, {
      controls: false,
      fill: true,
      loop: true,
    })
    player.src({ src: video_src, type: video_type})
    player.play()?.catch(() => {
      player.muted(true)
      player.play()
    })
  }
}


// websocket stuff

interface WebSocketCommand {
  cmd: string
}

class WebScoketClient {
  displaySlug: string | null
  ws: WebSocket | null = null
  heartbeat_interval: number | null = null
  unanswered_pings: number = 0

  constructor(autoconnect: boolean) {
    this.displaySlug = document.querySelector('body')?.dataset['displaySlug'] || null

    if (autoconnect) this.connect()
  }

  connect() {
    if (this.displaySlug === undefined || this.displaySlug == null) {
      return
    }
    this.ws = new WebSocket(
      (window.location.protocol === 'https:' ? 'wss://' : 'ws://')
      + window.location.host
      + '/ws/display/'
      + this.displaySlug
      + '/'
    )
    this.ws.onopen = () => {
      console.log('open')
      this.unanswered_pings = 0
      this.heartbeat_interval = window.setInterval(() => {
        console.log('sending ping')
        this.unanswered_pings += 1
        if (this.unanswered_pings > 30) window.location.reload()  // reload if we didn't get a pong for 300 sec
        this.ws?.send(JSON.stringify({
          cmd: 'ping'
        }))
      }, 5000)
    }
    this.ws.onmessage = (e) => {
      console.log("got data from websocket:", e.data)
      const data: WebSocketCommand = JSON.parse(e.data);
      switch (data?.cmd) {
        case 'reload':
          window.location.reload()
          break;
        case 'pong':
          this.unanswered_pings = 0
          break;
      }
    }
    this.ws.onclose = () => {
      this.reconnect()
    }
  }

  reconnect() {
    this.ws?.close()
    const timeout = 5000 + 2000 * Math.random()
    console.log('WS connection died, reconencting in %d', timeout)
    window.setTimeout(() => {
      this.connect()
    }, timeout)
  }

}

new WebScoketClient(true)
