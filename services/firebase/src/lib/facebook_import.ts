import { scrapeFbEvent } from 'facebook-event-scraper'
import { initIndex } from './algolia'
import { firestore } from '../firebase'
import { getCityId, getPlace } from './google_maps'

function getDate(timestamp: any) {
  if (!timestamp) {
    return ''
  }

  return timestamp * 1000
}

// todos:
// - idetify styles
// - convert venues to profiles

export async function getFacebookEvent(url: string) {
  const event = await scrapeFbEvent(url)

  const venueName = event.location?.name || ''
  const venueAddress = event.location?.address || ''
  const venueCountry = event.location?.countryCode || ''

  const venue = await getPlace(`${venueName} ${venueAddress} ${venueCountry}`)

  const place = await getCityId(venue)

  const orgFacebook = event.hosts[0]?.url.replace(
    'https://www.facebook.com/',
    ''
  )

  let org

  const orgResults = await initIndex('profiles').search(orgFacebook)
  if (orgResults.hits.length) {
    const p = orgResults.hits[0] as any

    org = {
      id: p.id,
      username: p.username,
      name: p.name || p.username || '',
      photo: p.photo || '',
      bio: p.bio || '',
      instagram: p.instagram || '',
      facebook: p.facebook || '',
      tiktok: p.tiktok || '',
      youtube: p.youtube || '',
    }
  } else {
    let username = event.hosts[0]?.url.replace('https://www.facebook.com/', '')

    if (username.includes('people/')) {
      username = username.split('/')[1].replace('-', '')
    }

    org = {
      name: event.hosts[0]?.name,
      facebook: event.hosts[0]?.url,
      photo: event.hosts[0]?.photo?.imageUri,
      username,
      type: 'Organiser',
      owned: false,
      owner: '',
      import: 'requested',
      visibility: 'Public',
      place,
    }

    await firestore.collection('profiles').add(org)
  }

  return {
    name: event.name,
    description: event.description,
    cover: event.photo?.imageUri,
    startDate: getDate(event.startTimestamp),
    endDate: getDate(event.endTimestamp),
    venue,
    place,
    link: event.ticketUrl || '',
    facebook: event.url,
    type: 'event',
    visibility: 'Public',
    form: 'No',
    online: 'No',
    international: 'No',
    claimed: 'No',
    eventType: 'Party',
    duration: 60,
    price: '',
    styles: {},
    artists: [],
    org,
    program: [],
    watch: {
      count: 0,
      usernames: [],
    },
  }
}
