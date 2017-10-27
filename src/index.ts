/**
 * When anyone in a channel bot is invited to sends a messages with a time
 * string, this handler activates and posts another message with same
 * time in timezones of all users in the channel.
 */
import { Slackbot } from '@xene/slack'
import * as moment from 'moment'
import { Moment } from 'moment'

const token = process.env['TOKEN']
const slack = new Slackbot({ botToken: token }).listen()

/**
 * Matches time strings in free form text
 * 12.12am, 12:12am, 1 12am, 1.12 am, 1.02 am
 * 23:23, 23 23, 23.23
 * 12am, 12PM, 1PM, 1am
 */
const TIME_RX = /[1-9]\d?(([:. ]\d{2}([ ]?[a|p]m)?)|([ ]?[a|p]m))/i

const hasTimeString = (s: string) => TIME_RX.test(s)
const parseTime = (s: string) => s.match(TIME_RX)[0]
const clockEmoji = (m: Moment) => `:clock${(m.hours() % 12) || 12}:`
const normalizeTime = (s: string) => moment(s, 'h:mA').format('h:mm A')
const normalizeZone = (o: number) => moment().utcOffset(o).format('Z')
const userZone = (id: string) => slack.users.info(id).then(i => i.tzOffset / 60)
const timeInZone = (t: string, z: number) => moment(`${t} ${normalizeZone(z)}`, 'h:mm A Z')
const slackTime = (m: Moment) => `<!date^${m.unix()}^{time} in your time zone|${m.format('h:m A z')}>`

slack.rtm.on('message', async ({ text, user, channel }) => {
  if (!hasTimeString(text) || slack.bot.id === user) return
  const timeString = normalizeTime(parseTime(text))
  const parsedTime = moment(timeString, 'h:mm A')
  if (!parsedTime.isValid()) return
  const time = timeInZone(timeString, await userZone(user))
  const options = { asUser: false, username: 'Your time', iconEmoji: clockEmoji(parsedTime) }
  slack.chat.postMessage(channel, { text: `*${timeString}* is *${slackTime(time.utc())}*.` }, options)
})
