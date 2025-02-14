import * as express from 'express'
import * as compression from 'compression'
import * as bodyParser from 'body-parser'
import * as cheerio from 'cheerio'
import verifier from 'google-id-token-verifier'
import * as favicon from 'serve-favicon'
import device from 'device'
import { renderToString } from 'react-dom/server'
import { Helmet } from 'react-helmet'
import pmx from 'pmx'
import { preloadAll } from 'react-loadable'

import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as qs from 'querystring'

import renderer from '../shared/renderer'

import routes from './routes'
import { Account } from './Account'
import { Course } from './Course'
import { API } from './scripts/api'
import { Database } from './Database'
import { DiscordBot } from './Discord'

import { log } from './scripts/util'

const cookieSession = require('cookie-session')

export const Bot = new DiscordBot()

const usersPerDay = pmx.probe().meter({
  name: 'users/day',
  samples: 86400,
  timeframe: 86400
})

const downloadMetrics = {
  downloadsPerDay: pmx.probe().meter({
    name: 'Downloads/day',
    samples: 86400,
    timeframe: 86400
  }),
  downloadsWiiUPerDay: pmx.probe().meter({
    name: 'Downloads WiiU/day',
    samples: 86400,
    timeframe: 86400
  }),
  downloads3DSPerDay: pmx.probe().meter({
    name: 'Downloads 3DS/day',
    samples: 86400,
    timeframe: 86400
  }),
  downloadsProtoPerDay: pmx.probe().meter({
    name: 'Downloads Proto/day',
    samples: 86400,
    timeframe: 86400
  }),
  downloads64PerDay: pmx.probe().meter({
    name: 'Downloads 64/day',
    samples: 86400,
    timeframe: 86400
  })
}

const $index = cheerio.load(fs.readFileSync(path.join(__dirname, '../client/index.html'), {
  encoding: 'utf8'
}))

export const cacheMaxAgeImg = '7d'
export const cacheMaxAgeCSS = '1d'
export const cacheMaxAgeJS = '1y';

// initialize database
(async (): Promise<void> => {
  try {
    await Database.initialize()
    await main()
  } catch (err) {
    console.log(err)
  }
})()

async function main (): Promise<void> {
  console.log()
  log('Database initialized')

  Bot.login()

  // initialize app engine
  const app = express()

  const server = http.createServer(app)

  app.set('trust proxy', 1)
  app.use(compression())
  app.use(bodyParser.json({
    limit: '500kb'
  }))
  app.use(bodyParser.raw({
    limit: '6mb'
  }))
  app.use(favicon(path.join(__dirname, '../../favicon.ico')))
  app.use('/img', express.static(path.join(__dirname, '../static/images'), { maxAge: cacheMaxAgeImg }))
  app.use('/styles', express.static(path.join(__dirname, '../static/styles'), { maxAge: cacheMaxAgeCSS }))
  app.use('/scripts', express.static(path.join(__dirname, '../client/scripts'), { maxAge: cacheMaxAgeJS }))
  app.use(cookieSession({
    name: 'session',
    keys: '123',
    maxAge: 24 * 60 * 60 * 1000
  }))
  const connections: any = {}
  app.use((req, res, next): void => {
    const ip = req.ip
    if (!connections.hasOwnProperty(ip)) {
      usersPerDay.mark()
      connections[ip] = {}
      setTimeout((): void => {
        delete connections[ip]
      }, 86400 * 1000)
    }
    next()
  })

  app.use('/api/v2', routes)

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS')

    if (req.method === 'OPTIONS') {
      res.send(200)
    } else {
      next()
    }
  })

  app.use('/courseimg/:id*?', async (req, res): Promise<void> => {
    const [id, full] = req.params.id.split('.')[0].split('_')
    if (id == null) {
      res.status(404).send('No course ID specified')
      return
    }
    try {
      const acceptHeader = req.get('accept')
      const acceptWebp = acceptHeader && acceptHeader.includes('image/webp')
      const img = await Database.getImage(id, !!full, !!acceptWebp)
      if (img == null) {
        res.status(404).send(`Course with ID ${id} has no image`)
        return
      }
      res.set('Content-Type', acceptWebp ? 'image/webp' : 'image/jpeg')
      res.set('Cache-Control', `public, max-age=${cacheMaxAgeImg}`)
      res.send(img)
    } catch (err) {
      res.status(500).send(`Internal Server Error:\n${err}`)
    }
  })

  app.use('/course64img/:id*?', async (req, res): Promise<void> => {
    const id = req.params.id
    if (id == null) {
      res.status(404).send('No course ID specified')
      return
    }
    try {
      const img = await Database.getImage64(id)
      if (img == null) {
        res.status(404).send(`Course with ID ${id} has no image`)
        return
      }
      res.set('Content-Type', 'image/jpeg')
      res.set('Cache-Control', `public, max-age=${cacheMaxAgeImg}`)
      res.send(img)
    } catch (err) {
      res.status(500).send(`Internal Server Error:\n${err}`)
    }
  })

  app.route('/tokensignin').post((req, res): void => {
    res.set('Access-Control-Allow-Headers', 'content-type')
    let idToken = req.body.tokenObj.id_token
    if (!idToken) {
      res.status(400).send('idToken not found')
    } else {
      verifier.verify(idToken, process.env.GOOGLE_CLIENT_ID, async (err: Error, tokenInfo: any): Promise<void> => {
        if (err) {
          res.status(400).send('idToken not verified')
          return
        }

        // create account if it does not exist
        let googleId = tokenInfo.sub

        let account = await Account.getAccountByGoogleId(googleId, false)
        if (!account) {
          // create new account
          try {
            account = await Account.createAccount({
              googleid: googleId,
              username: tokenInfo.email.split('@')[0],
              email: tokenInfo.email,
              idtoken: idToken
            })
          } catch (err) {
            console.error(err)
          }
        } else {
          await Account.login(account._id, idToken)
        }
        req.session.idtoken = idToken
        res.json(account)
      })
    }
  })

  app.route('/signin').post(async (req, res): Promise<void> => {
    if (!req.session.idtoken) {
      res.status(400).send('No idToken submitted. Have you enabled cookies?')
      return
    }
    const account = await Account.getAccountBySession(req.session.idtoken, false)
    if (!account) {
      res.status(400).send('Account not found')
      return
    }
    res.json(account)
  })

  app.route('/signout').post(async (req, res): Promise<void> => {
    if (!req.session.idtoken) {
      res.status(400).send('No idToken submitted. Have you enabled cookies?')
      return
    }
    let account = await Account.getAccountBySession(req.session.idtoken)
    if (!account) {
      res.status(400).send('Account not found')
      return
    }
    await Account.logout(account._id)
    res.send('OK')
  })

  app.route('/api/:apicall*?').get(async (req, res): Promise<void> => {
    if (req.url.includes('/') && req.url.length > 5) {
      const apiCall = req.params.apicall
      let apiData = {}
      if (req.url.includes('?')) {
        apiData = qs.parse(req.url.split('?', 2)[1])
      }

      res.set('Access-Control-Allow-Origin', '*')
      if (!apiCall) {
        res.status(400).send('Wrong syntax')
      } else if (apiCall === 'getstats') {
        API.getStats(res)
      } else if (apiCall === 'getcourses') {
        API.getCourses(app, req, res, apiData)
      } else if (apiCall === 'getcourses64') {
        API.getCourses64(app, req, res, apiData)
      } else if (apiCall === 'downloadcourse') {
        API.downloadCourse(req, res, apiData, downloadMetrics)
      } else if (apiCall === 'downloadcourse64') {
        API.downloadCourse64(req, res, apiData, downloadMetrics)
      } else if (apiCall === 'deletecourse') {
        API.deleteCourse(req, res, apiData)
      } else if (apiCall === 'deletecourse64') {
        API.deleteCourse64(req, res, apiData)
      } else if (apiCall === 'getaccountdata') {
        await API.getAccountData(req, res)
      } else if (apiCall === 'getnet64servers') {
        await API.getNet64Servers(req, res, apiData)
      } else {
        res.status(400).send('Wrong syntax')
      }
    } else {
      res.status(400).send('Wrong syntax')
    }
  }).post(async (req, res): Promise<void> => {
    let apiCall = req.params.apicall
    let apiData = {}
    if (req.url.includes('?')) {
      let split = req.url.split('?', 2)
      let data = split[1]
      apiData = qs.parse(data)
    }

    if (apiCall === 'uploadcourse') {
      API.uploadCourse(req, res, apiData)
    } else if (apiCall === 'uploadcourse64') {
      API.uploadCourse64(req, res)
    } else if (apiCall === 'reuploadcourse') {
      API.reuploadCourse(req, res, apiData)
    } else if (apiCall === 'reuploadcourse64') {
      API.reuploadCourse64(req, res, apiData)
    } else if (apiCall === 'updatecourse') {
      API.updateCourse(req, res, apiData)
    } else if (apiCall === 'updatecourse64') {
      API.updateCourse64(req, res, apiData)
    } else if (apiCall === 'starcourse') {
      API.starCourse(req, res, apiData)
    } else if (apiCall === 'starcourse64') {
      API.starCourse64(req, res, apiData)
    } else if (apiCall === 'setaccountdata') {
      API.setAccountData(req, res)
    } else if (apiCall === 'uploadimagefull') {
      API.uploadImage(req, res, true)
    } else if (apiCall === 'uploadimageprev') {
      API.uploadImage(req, res, false)
    } else if (apiCall === 'uploadimage64') {
      API.uploadImage64(req, res)
    } else if (apiCall === 'net64server') {
      API.sendNet64Server(req, res, apiData)
    } else if (apiCall === 'blogpost') {
      API.blogPost(req, res)
    } else {
      res.status(400).send('Wrong syntax')
    }
  })

  app.use('/:route?', async (req: express.Request, res: express.Response): Promise<void> => {
    if (req.params.route === 'net64') {
      handleNet64Redirect(req, res)
      return
    }
    const websiteStats = {
      courses: await Course.getCourseAmount(),
      accounts: await Account.getAccountAmount()
    }
    const d = device(req.get('user-agent'))
    let [html, preloadedState, modules] = await renderer(
      true,
      renderToString,
      null,
      req,
      await API.filterCourses(undefined, { limit: 10 }),
      await API.filterCourses64(undefined, { limit: 16 }),
      websiteStats,
      d.is('phone'),
      d.is('tablet')
    )
    const getBundles = require('react-loadable/webpack').getBundles
    const stats = require('../../build/react-loadable.json')
    const bundles = getBundles(stats, modules)
    const helmet = Helmet.renderStatic()
    const index = cheerio.load($index.html())
    index('#root').html(html)
    index('head').prepend(helmet.title.toString())
    index('head').prepend(helmet.meta.toString())
    index('head').prepend(bundles.map((bundle: any): string =>
      `<link rel="preload" href="/scripts/${bundle.file}" as="script">`
    ).join('\n'))
    index('body').prepend(`<script>window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}</script>`)
    res.send(index.html())
  })

  await preloadAll()
  server.listen(process.env.PORT, (): void => {
    log(`Server is listening on port ${process.env.PORT}`)
  })
}

function handleNet64Redirect (req: express.Request, res: express.Response) {
  res.redirect(301, 'https://net64-mod.github.io/')
}
