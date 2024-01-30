import axios from "axios"
import { isEmpty, pick } from "lodash"

import { YUKON_GOVERNMENT_OCP_APIM_SUBSCRIPTION_KEY } from "@/config"

export const yukonGovernmentApi = axios.create({
  baseURL: "https://api.gov.yk.ca",
  headers: {
    "Ocp-Apim-Subscription-Key": YUKON_GOVERNMENT_OCP_APIM_SUBSCRIPTION_KEY,
  },
})

// Its possible that any field might be null, but I haven't been able to verify this.
type YukonGovernmentEmployee = {
  full_name: string //  "John.Doe"
  first_name: string //  "John"
  last_name: string //  "Doe"
  organization: string | null //  null
  department: string //  "Example Department"
  division: string | null //  "Example Division"
  branch: string | null //  "Example Branch"
  unit: string | null //  "Example Unit"
  title: string //  "Example Title"
  email: string //  "john.doe@example.com"
  suite: string //  ""
  phone_office: string //  "123-456-7890"
  fax_office: string //  ""
  mobile: string //  "987-654-3210"
  office: string //  "Example Office Location"
  address: string //  "1234 Example Street"
  po_box: string //  "100"
  community: string //  "Example City"
  postal_code: string //  "X0X 0X0"
  latitude: number | null //  null
  longitude: number | null //  null
  mailcode: string //  "XYZ"
  manager: string //  "Jane.Manager"
  username: string //  "jdoe"
}

type YukonGovernmentDivision = {
  department: string // "Cabinet Office",
  division: string | null // null,
  branch: string | null // null,
  unit: string | null // null,
  order: number // 100
}

export const yukonGovernmentIntegration = {
  async searchEmployees(params: { email?: string }): Promise<{
    employees: YukonGovernmentEmployee[]
    count: number
  }> {
    const { data } = await yukonGovernmentApi.get("/directory/employees", {
      params,
    })
    return data
  },
  async fetchEmpolyee(email: string): Promise<{
    employee: YukonGovernmentEmployee
  }> {
    const { employees } = await yukonGovernmentIntegration.searchEmployees({ email })

    if (isEmpty(employees)) {
      throw new Error(
        `Failed to find any employee info at https://api.gov.yk.ca/directory/employees?email=${email}`
      )
    }

    if (employees.length > 1) {
      let errorMessage = `Found more than one employee info at https://api.gov.yk.ca/directory/employees?email=${email}`
      const emails = pick(employees, "email")
      errorMessage = errorMessage.concat(`\nemails found: ${JSON.stringify(emails)}`)
      throw new Error(errorMessage)
    }

    return { employee: employees[0] }
  },
  async fetchDepartments(): Promise<{
    departments: string[]
    count: number
  }> {
    const { data } = await yukonGovernmentApi.get("/directory/departments")
    return data
  },
  async fetchDivisions(): Promise<{
    divisions: YukonGovernmentDivision[]
    count: number
  }> {
    const { data } = await yukonGovernmentApi.get("/directory/divisions")
    return data
  },
}

export default yukonGovernmentIntegration