import { Dropdown, TextInput} from 'flowbite-react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

const Searchbar = () => {
    return (
      <div className='grid grid-cols-6 justify-items-end'>
        <TextInput
          className='col-span-5 w-full'
          id="search4"
          type="search"
          icon={MagnifyingGlassIcon}
          placeholder="Search tokens..."
          required={true}
        />
        <Dropdown
          label="Filter By"
          dismissOnClick={false}
        >
          <Dropdown.Item>
            Verified
          </Dropdown.Item>
          <Dropdown.Item>
            Submissions
          </Dropdown.Item>
          <Dropdown.Item>
            Challenged Submissions
          </Dropdown.Item>
          <Dropdown.Item>
            Rejected
          </Dropdown.Item>
          <Dropdown.Item>
            Removal Requests
          </Dropdown.Item>
          <Dropdown.Item>
            Challenged Removal Requests
          </Dropdown.Item>
        </Dropdown>
      </div>
    )
}

export default Searchbar;