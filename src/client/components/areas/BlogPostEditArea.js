import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import got from 'got'
import marked from 'marked'
import { emojify } from 'node-emoji'

import { resolve } from 'url'

import SMMButton from '../buttons/SMMButton'
import { ScreenSize } from '../../reducers/mediaQuery'

const UPDATE_INTERVAL = 10000

class BlogPostEditArea extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      markdown: '',
      blogId: ''
    }
    this.loadCurrentBlogPost = this.loadCurrentBlogPost.bind(this)
    this.getCurrentBlogPost = this.getCurrentBlogPost.bind(this)
    this.updateCurrentBlogPost = this.updateCurrentBlogPost.bind(this)
    this.onTextAreaChange = this.onTextAreaChange.bind(this)
    this.onGoBack = this.onGoBack.bind(this)
    this.onPublishBlogPost = this.onPublishBlogPost.bind(this)
  }
  async componentWillMount () {
    if (!this.props.apiKey) return
    this.loadCurrentBlogPost(this.props.apiKey)
  }
  componentWillUnmount () {
    if (this.timer) clearInterval(this.timer)
  }
  componentWillReceiveProps (nextProps, nextState) {
    if (!nextProps.apiKey || this.props.apiKey === nextProps.apiKey || nextState.loading) return
    this.loadCurrentBlogPost(nextProps.apiKey)
  }
  async componentWillUpdate (nextProps, nextState) {
    if (!nextState.markdown || nextState.markdown === this.state.markdown) return
    this.renderer.innerHTML = emojify(marked(nextState.markdown))
  }
  async loadCurrentBlogPost (apiKey) {
    this.setState({
      loading: true
    })
    await this.getCurrentBlogPost(apiKey)
    this.setState({
      loading: false
    })
    if (!this.timer) this.timer = setInterval(this.updateCurrentBlogPost.bind(this), UPDATE_INTERVAL)
  }
  async getCurrentBlogPost (apiKey) {
    try {
      let currentBlogPost = (await got(resolve(process.env.DOMAIN, `/api/blogpost`), {
        headers: {
          'Authorization': `APIKEY ${apiKey}`
        },
        method: 'POST',
        body: {
          method: 'get',
          getCurrent: true
        },
        json: true,
        useElectronNet: false
      })).body
      console.log(currentBlogPost)
      if (currentBlogPost.length === 0) return
      currentBlogPost = currentBlogPost[0]
      this.setState({
        markdown: currentBlogPost.markdown || '',
        blogId: currentBlogPost._id
      })
    } catch (err) {
      if (err.response) {
        console.error(err.response.body)
      } else {
        console.error(err)
      }
    }
  }
  async updateCurrentBlogPost () {
    const res = (await got(resolve(process.env.DOMAIN, `/api/blogpost`), {
      headers: {
        'Authorization': `APIKEY ${this.props.apiKey}`
      },
      method: 'POST',
      body: {
        method: 'update',
        markdown: this.state.markdown,
        blogId: this.state.blogId
      },
      json: true,
      useElectronNet: false
    })).body
    this.setState({
      blogId: res._id
    })
  }
  onTextAreaChange (e) {
    this.setState({
      markdown: e.target.value.replace(/<.*>/g, '')
    })
  }
  async onGoBack () {
    await this.updateCurrentBlogPost()
    this.props.history.goBack()
  }
  async onPublishBlogPost () {
    try {
      const res = (await got(resolve(process.env.DOMAIN, `/api/blogpost`), {
        headers: {
          'Authorization': `APIKEY ${this.props.apiKey}`
        },
        method: 'POST',
        body: {
          method: 'publish',
          blogId: this.state.blogId,
          markdown: this.state.markdown
        },
        json: true,
        useElectronNet: false
      })).body
      this.props.onPublish(res)
      this.props.history.goBack()
    } catch (err) {
      if (err.response) {
        console.error(err.response.body)
      } else {
        console.error(err)
      }
    }
  }
  render () {
    const styles = {
      area: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      },
      blog: {
        width: '100%',
        flex: '1 0 auto',
        display: 'flex',
        flexWrap: 'wrap'
      },
      buttons: {
        display: 'flex',
        flex: '0 0 auto',
        justifyContent: 'space-between',
        width: '100%',
        padding: '1rem'
      },
      widgets: {
        padding: '10px',
        fontSize: '18px'
      },
      widget: {
        cursor: 'pointer',
        margin: '5px',
        width: '24px',
        height: '24px'
      },
      editor: {
        width: '46%',
        margin: '0 2%',
        backgroundColor: '#fffff5',
        color: '#000',
        fontFamily: 'Georgia,Cambria,"Times New Roman",Times,serif',
        padding: '10px',
        resize: 'none',
        overflow: 'auto'
      },
      editorRendered: {
        width: '46%',
        margin: '0 2%',
        backgroundColor: '#fffff5',
        color: '#000',
        fontFamily: 'Georgia,Cambria,"Times New Roman",Times,serif',
        padding: '10px',
        overflow: 'auto'
      }
    }
    /* TODO as long as image upload is not implemented, services like imgur can be used
    <UploadImageArea
      type='blog'
      courseId={this.state._id}
      upload={blog.get(this.state._id)}
      onUploadComplete={null}
    />
    */
    return (
      <div style={styles.area}>
        <div style={styles.blog} className='blog'>
          <textarea style={styles.editor} value={this.state.markdown} onChange={this.onTextAreaChange} />
          <div style={styles.editorRendered} ref={x => { this.renderer = x }} />
        </div>
        <div style={styles.buttons}>
          <SMMButton
            onClick={this.onGoBack}
            text='Go back and save'
            iconSrc='/img/back.svg'
            iconColor='bright'
            padding='3px'
          />
          <SMMButton
            onClick={this.onPublishBlogPost}
            text='Publish'
            iconSrc='/img/compose.svg'
            iconColor='bright'
            padding='3px'
          />
        </div>
      </div>
    )
  }
}
export default withRouter(connect(state => ({
  screenSize: state.getIn(['mediaQuery', 'screenSize'])
}))(BlogPostEditArea))
