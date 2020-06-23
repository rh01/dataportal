/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount, Wrapper } from '@vue/test-utils'
import Search from '../src/views/Search.vue'
import axios, { AxiosResponse, AxiosPromise, AxiosRequestConfig } from 'axios'
import Vue from 'vue'
import {init, allFiles, allSites, dateToISOString, tomorrow, allProducts, allSearch} from './lib'
import { mocked } from 'ts-jest/dist/util/testing'
init()

const filesSortedByDate = allFiles
  .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())

jest.mock('axios')

const axiosResponse: AxiosResponse = {
  data: {},
  status: 200,
  statusText: 'OK',
  config: {},
  headers: {}
}

const augmentAxiosResponse = (data: any) => ({ ...axiosResponse, ...{ data } })

const defaultAxiosMock = (url: string, _: AxiosRequestConfig | undefined): AxiosPromise => {
  if (url.includes('files')) {
    return Promise.resolve(augmentAxiosResponse(allFiles))
  } else if (url.includes('sites')) { // sites
    return Promise.resolve(augmentAxiosResponse(allSites))
  } else if (url.includes('search')) { // search
    return Promise.resolve(augmentAxiosResponse(allSearch))
  } else {
    return Promise.resolve(augmentAxiosResponse(allProducts))
  }
}

const getMockedAxiosLastCallSecondArgument = () => {
  const calls = mocked(axios.get).mock.calls
  const idxLast = calls.length - 1
  const lastCall = calls[idxLast]
  const secondArg = lastCall[1]
  if (!secondArg) return {}
  return secondArg
}

const dateFromDefault = '2020-01-01'
const dateToDefault = new Date().toISOString().substring(0,10)

describe('Search.vue', () => {
  let wrapper: Wrapper<Vue>

  const findInputByName = (inputName: string) => wrapper.find(`input[name="${inputName}"]`)
  const findElementById = (id: string) => wrapper.find(`#${id}`)
  const getInputValueByName = (inputName: string) =>
    (wrapper.find(`input[name="${inputName}"]`).element as HTMLInputElement).value

  const changeInputAndNextTick = async (inputName: string, newValue: string) => {
    const input = findInputByName(inputName)
    const inputElement = (input.element as HTMLInputElement)
    inputElement.value = newValue
    input.trigger('change')
    await Vue.nextTick()
  }

  beforeAll(() => {
    mocked(axios.get).mockImplementation(defaultAxiosMock)
    wrapper = mount(Search, { propsData: { mode: 'data'}})
  })

  it('makes less than four api request on mount', () => {
    // files and sites
    expect(mocked(axios.get).mock.calls.length).toBeLessThan(4)
  })

  describe('date selectors', () => {

    it('has the first day of the current year as the default dateFrom', () => {
      expect(getInputValueByName('dateFrom')).toBe(dateFromDefault)
    })

    it('has today as the default dateTo', () => {
      expect(getInputValueByName('dateTo')).toBe(dateToDefault)
    })

    it('displays data objects between dateFrom and dateTo by default', () => {
      allSearch.map(file => file.measurementDate).forEach(date =>
        expect(wrapper.text()).toContain(date)
      )
    })

    it('fetches updated list of files from api on dateFrom change', async () => {
      const newValue = filesSortedByDate[1].measurementDate
      await changeInputAndNextTick('dateFrom', newValue)
      const secondArg = getMockedAxiosLastCallSecondArgument()
      return expect(dateToISOString(secondArg.params.dateFrom)).toEqual(newValue)
    })

    it('fetches updated list of files from api on dateTo change', async () => {
      const newValue = filesSortedByDate[3].measurementDate
      await changeInputAndNextTick('dateTo', newValue)
      const secondArg = getMockedAxiosLastCallSecondArgument()
      return expect(dateToISOString(secondArg.params.dateTo)).toEqual(newValue)
    })

    it('updates table based on api response', async () => {
      mocked(axios.get).mockImplementationOnce((_1, _2) => Promise.resolve(augmentAxiosResponse(allFiles.slice(1))))
      const newValue = filesSortedByDate[0].measurementDate
      await changeInputAndNextTick('dateFrom', newValue)
      // Contains the dates of all files except the first
      allFiles
        .slice(1)
        .map(file => file.measurementDate).forEach(date =>
          expect(wrapper.text()).toContain(date)
        )
      return expect(wrapper.text()).not.toContain(allFiles[0].measurementDate)
    })

    it('does not touch API on invalid input', async () => {
      const numberOfCallsBefore = mocked(axios.get).mock.calls.length
      const newValue = 'asdf'
      await changeInputAndNextTick('dateTo', newValue)
      await changeInputAndNextTick('dateFrom', newValue)
      const numberOfCallsAfter = mocked(axios.get).mock.calls.length
      return expect(numberOfCallsBefore).toEqual(numberOfCallsAfter)
    })

    it('displays error when inserting invalid input', async () => {
      const newValue = 'asdf'
      await changeInputAndNextTick('dateTo', newValue)
      await changeInputAndNextTick('dateFrom', newValue)
      expect(wrapper.text()).toContain('Invalid input')
      expect(findElementById('dateTo').classes()).toContain('error')
      return expect(findElementById('dateFrom').classes()).toContain('error')
    })

    it('resets error when replacing invalid input with valid', async () => {
      const newValue = 'asdf'
      await changeInputAndNextTick('dateTo', newValue)
      await changeInputAndNextTick('dateFrom', newValue)
      await changeInputAndNextTick('dateFrom', '2018-09-01')
      await changeInputAndNextTick('dateTo', '2018-09-02')
      expect(wrapper.text()).not.toContain('Invalid input')
      expect(findElementById('dateTo').classes()).not.toContain('error')
      return expect(findElementById('dateFrom').classes()).not.toContain('error')
    })

    it('displays error if date is in the future', async () => {
      await changeInputAndNextTick('dateFrom', dateToISOString(tomorrow()))
      await changeInputAndNextTick('dateTo', dateToISOString(tomorrow()))
      expect(wrapper.text()).toContain('Provided date is in the future.')
      expect(findElementById('dateFrom').classes()).toContain('error')
      return expect(findElementById('dateTo').classes()).toContain('error')
    })

    it('displays error if dateFrom is later than dateTo', async () => {
      await changeInputAndNextTick('dateFrom', '2018-09-02')
      await changeInputAndNextTick('dateTo', '2018-09-01')
      expect(wrapper.text()).toContain('Date from must be before date to.')
      expect(findElementById('dateFrom').classes()).toContain('error')
      return expect(findElementById('dateTo').classes()).toContain('error')
    })
  })

  describe('volatility', () => {

    it('displays text "volatile" only next to volatile items', async () => {
      expect(findElementById('tableContent').text()).toContain('volatile')
      return expect(findElementById('tableContent').text().match('volatile')).toHaveLength(1)
    })
  })
})
