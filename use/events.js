import { addMinutes, parseISO } from 'date-fns'
import firebase from 'firebase/app'
import 'firebase/firestore'
import { useCities } from '~/use/cities'
import { useI18n } from '~/use/i18n'
import { getYmd, toDatetimeLocal } from '~/utils'

const updateEndDate = (newItem, oldItem) => {
  if (oldItem?.endDate) {
    return
  }

  newItem.endDate = toDatetimeLocal(addMinutes(parseISO(newItem.startDate), 60))
}

export async function getEventsWithVenue(username) {
  const result = await firebase
    .firestore()
    .collection('posts')
    .where('venueProfile.username', '==', username)
    .get()

  return result.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    role: 'Venue',
  }))
}

export async function getEventsOrganisedBy(username) {
  const result = await firebase
    .firestore()
    .collection('posts')
    .where('org.username', '==', username)
    .get()

  return result.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    role: 'Organiser',
  }))
}

export async function getEventsWithArtist(username) {
  const result = await firebase
    .firestore()
    .collection('posts')
    .where('artistsList', 'array-contains', username)
    .get()

  return result.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    role: 'Special Guest',
  }))
}

export async function getEventsWithGuest(username) {
  const result = await firebase
    .firestore()
    .collection('posts')
    .where(`star.usernames`, 'array-contains', username)
    .get()

  return result.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    role: 'Guest',
  }))
}

export async function getEventsInPlace(placeId) {
  const result = await firebase
    .firestore()
    .collection('posts')
    .where('place', '==', placeId)
    .where('startDate', '>=', +new Date())
    .get()

  return result.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }))
}

export async function getFestivals() {
  const festivals = (
    await firebase
      .firestore()
      .collection('posts')
      .where('eventType', '==', 'Festival')
      .get()
  ).docs

  const congresses = (
    await firebase
      .firestore()
      .collection('posts')
      .where('eventType', '==', 'Congress')
      .get()
  ).docs

  const events = [...festivals, ...congresses]

  return events.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  }))
}

export const useEvents = () => {
  const { t } = useI18n()
  const { currentCity } = useCities()

  const eventRoleOptions = [
    {
      label: t('event.role.instructor'),
      value: 'instructor',
    },
    {
      label: t('event.role.dj'),
      value: 'dj',
    },
    {
      label: t('event.role.musician'),
      value: 'musician',
    },
    {
      label: t('event.role.taxi'),
      value: 'taxi',
    },
    {
      label: t('event.role.photographer'),
      value: 'photographer',
    },
    {
      label: t('event.role.organiser'),
      value: 'organiser',
    },
  ]

  const eventTypeList = [
    {
      label: t('events.typelist.party'),
      value: 'Party',
      icon: '🎵',
      festival: true,
    },
    {
      label: t('events.typelist.workshop'),
      value: 'Workshop',
      icon: '🎓',
      festival: true,
    },
    {
      label: t('events.typelist.course'),
      value: 'Course',
      icon: '🎓',
    },
    {
      label: t('events.typelist.festival'),
      value: 'Festival',
      icon: '✈️',
    },
    {
      label: t('events.typelist.congress'),
      value: 'Congress',
      icon: '✈️',
    },
    {
      label: t('events.typelist.concert'),
      value: 'Concert',
      icon: '🎵',
      festival: true,
    },
    {
      label: t('events.typelist.show'),
      value: 'Show',
      icon: '🎵',
      festival: true,
    },
    {
      label: t('events.typelist.other'),
      value: 'Other',
      icon: '🎵',
    },
  ]

  const now = new Date()
  const startOfTodayString = getYmd(now)

  const isPublic = (item) => item.visibility !== 'Unlisted'

  const isUpcoming = (item) =>
    getYmd(item.startDate) >= startOfTodayString && isPublic(item)

  const isInSelectedCity = (item) => item.place === currentCity.value

  const eventCategoryOptions = [
    {
      label: t('event.category.meetup'),
      value: 'meetup',
      icon: '🎵',
      filter: (item) => isUpcoming(item) && isInSelectedCity(item),
    },
    {
      label: t('event.category.lesson'),
      value: 'lesson',
      icon: '🎓',
      filter: (item) =>
        ['Workshop', 'Course'].includes(item.eventType) &&
        isUpcoming(item) &&
        (isInSelectedCity(item) || item.online === 'Yes'),
    },
    {
      label: t('event.category.travel'),
      value: 'travel',
      icon: '✈️',
      types: ['Festival', 'Congress'],
      filter: (item) =>
        ['Festival', 'Congress'].includes(item.eventType) && isUpcoming(item),
    },
  ]

  function addLabelIcons(options) {
    return options.map((type) => ({
      ...type,
      label: `${type.icon}  ${type.label}`,
    }))
  }

  const eventTypeListIcons = eventTypeList.map((type) => ({
    ...type,
    label: `${type.icon}  ${type.label}`,
  }))

  function getEventIcon(eventType) {
    const typeOption =
      eventTypeListIcons.find((type) => type.value === eventType) || 'Other'

    return typeOption.icon
  }

  function getEventTypeLabel(eventType) {
    return (
      eventTypeList.find((type) => type.value === eventType)?.label || eventType
    )
  }

  const eventFields = [
    {
      name: 'name',
      labelPosition: 'top',
      placeholder: t('event.name.placeholder'),
      label: t('event.name.label'),
    },
    {
      name: 'description',
      label: t('event.description.label'),
      description: t('event.description.description'),
      labelPosition: 'top',
      component: 'TInputTextarea',
      placeholder: t('event.description.placeholder'),
      max: 280,
    },
    {
      name: 'confirmation',
      labelPosition: 'top',
      label: t('event.confirmation.label'),
      description: t('event.confirmation.description'),
      component: 'TInputTextarea',
      placeholder: t('event.confirmation.placeholder'),
    },
    {
      name: 'cover',
      label: t('event.cover.label'),
      description: t('event.cover.description'),
      component: 'TInputPhoto',
      labelPosition: 'top',
      width: 500,
      height: 500,
      circle: false,
    },
    {
      name: 'link',
      labelPosition: 'top',
      placeholder: t('event.link.placeholder'),
      description: t('event.link.description'),
      label: t('event.link.label'),
    },
    {
      name: 'eventType',
      label: t('event.type'),
      labelPosition: 'top',
      component: 'TInputSelect',
      options: eventTypeList,
    },
    {
      name: 'startDate',
      component: 'DatePicker',
      labelPosition: 'top',
      type: 'datetime',
      format: 'YYYY-MM-DDTHH:mm',
      'time-picker-options': {
        start: '00:00',
        step: '00:30',
        end: '23:30',
        format: 'HH:mm',
      },
      'value-type': 'timestamp',
      label: 'Start date',
      simple: true,
      onChange: updateEndDate,
    },
    {
      name: 'endDate',
      component: 'DatePicker',
      type: 'datetime',
      format: 'YYYY-MM-DDTHH:mm',
      'time-picker-options': {
        start: '00:00',
        step: '00:30',
        end: '23:30',
        format: 'HH:mm',
      },
      'value-type': 'timestamp',
      labelPosition: 'top',
      label: 'End date',
      simple: true,
    },
    {
      name: 'venueProfile',
      component: 'TInputProfile',
      label: t('event.venueProfile.label'),
      before: t('event.venueProfile.description'),
      labelPosition: 'top',
    },
    {
      name: 'venue',
      label: t('event.venue'),
      labelPosition: 'top',
      component: 'TInputVenue',
      simple: true,
    },
    {
      name: 'place',
      label: t('event.place.label'),
      description: t('event.place.description'),
      labelPosition: 'top',
      component: 'TInputPlace',
      clearable: true,
    },
    {
      name: 'online',
      label: 'Is it available online?',
      component: 'TInputButtons',
      options: ['Yes', 'No'],
      before: 'Streaming via Zoom, Google Meet, Instagram Live, etc.?',
      labelPosition: 'top',
    },
    {
      name: 'price',
      labelPosition: 'top',
      label: t('event.price.label'),
      description: t('event.price.description'),
    },
    {
      name: 'specialOffer',
      labelPosition: 'top',
      label: 'Special Offer',
      description: 'For example: Get 10% off with WeDance discount',
    },
    {
      name: 'styles',
      labelPosition: 'top',
      label: t('event.styles.label'),
      description: t('event.styles.description'),
      component: 'TInputStylesSelect2',
    },
    {
      name: 'org',
      component: 'TInputProfile',
      label: t('event.org.label'),
      description: t('event.org.description'),
      labelPosition: 'top',
    },
    {
      name: 'facebook',
      labelPosition: 'top',
      description: t('event.facebook.description'),
      label: t('event.facebook.label'),
    },
  ]

  return {
    eventCategoryOptions,
    eventTypeList,
    eventTypeListIcons,
    getEventIcon,
    eventFields,
    addLabelIcons,
    eventRoleOptions,
    getEventTypeLabel,
  }
}
