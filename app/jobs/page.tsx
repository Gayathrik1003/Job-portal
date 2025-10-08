import { cookies } from "next/headers"
import Link from "next/link"
import { Briefcase, MapPin, DollarSign, Clock, Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JobsFilters } from "./filters"
import { sql } from "@/lib/db"
import { getUserFromToken } from "@/lib/auth"
import type { Job } from "@/lib/db"

interface JobsPageProps {
  searchParams: Promise<{
    q?: string
    location?: string
    remote?: string
    currency?: string
    type?: string
    domain?: string
    min_salary?: string
    page?: string
  }>
}

async function getJobs(searchParams: JobsPageProps["searchParams"]) {
  const { q, location, remote, currency, type, domain, min_salary, page } = searchParams
  const currentPage = Number.parseInt(page || "1")
  const limit = 10
  const offset = (currentPage - 1) * limit

  // Normalize filters to avoid accidental over-filtering
  const normalizedType = type && type !== "All Types" ? type : undefined
  const normalizedDomain = domain && domain !== "All Domains" ? domain : undefined
  const normalizedCurrency = currency && currency.trim() !== "" && currency !== "any" ? currency : undefined
  const minSalaryNum = min_salary ? Number.parseInt(min_salary) : NaN

  // Start with a simple query to get all open jobs
  let jobs: any[] = []
  let totalJobs = 0

  try {
    // First, get all open jobs with basic info
    const allJobs = await sql`
      SELECT j.*, ep.company_name, ep.logo_url as company_logo
      FROM jobs j
      LEFT JOIN employer_profiles ep ON j.employer_id = ep.user_id
      WHERE j.is_open = true
      ORDER BY j.posted_at DESC
    `
    console.log('All jobs query result:', allJobs)

    // Apply filters in JavaScript for now (simpler and more reliable)
    let filteredJobs = allJobs

    if (q) {
      const searchTerm = q.toLowerCase()
      filteredJobs = filteredJobs.filter(job => 
        job.title?.toLowerCase().includes(searchTerm) ||
        job.description?.toLowerCase().includes(searchTerm) ||
        job.company_name?.toLowerCase().includes(searchTerm)
      )
    }

    if (location) {
      const locationTerm = location.toLowerCase()
      filteredJobs = filteredJobs.filter(job => 
        job.location?.toLowerCase().includes(locationTerm)
      )
    }

    if (remote === "true") {
      filteredJobs = filteredJobs.filter(job => job.is_remote === true)
    }

    if (normalizedType) {
      filteredJobs = filteredJobs.filter(job => 
        job.job_type?.toLowerCase().includes(normalizedType.toLowerCase())
      )
    }

    if (normalizedDomain) {
      filteredJobs = filteredJobs.filter(job => 
        job.domain?.toLowerCase().includes(normalizedDomain.toLowerCase())
      )
    }

    if (normalizedCurrency) {
      filteredJobs = filteredJobs.filter(job => 
        job.salary?.includes(normalizedCurrency)
      )
    }

    if (Number.isFinite(minSalaryNum)) {
      filteredJobs = filteredJobs.filter(job => {
        if (!job.salary) return false
        const salaryMatch = job.salary.match(/\d+/)
        if (!salaryMatch) return false
        return parseInt(salaryMatch[0]) >= minSalaryNum
      })
    }

    totalJobs = filteredJobs.length
    jobs = filteredJobs.slice(offset, offset + limit)

  } catch (error) {
    console.error('Error fetching jobs:', error)
    // Fallback to simple query
    jobs = await sql`SELECT * FROM jobs WHERE is_open = true LIMIT 10`
    totalJobs = jobs.length
  }

  const totalPages = Math.ceil(totalJobs / limit)

  return {
    jobs: Array.isArray(jobs) ? jobs : [],
    totalJobs,
    totalPages,
    currentPage,
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  const user = token ? await getUserFromToken(token) : null

  // In Next.js 15, searchParams is a Promise
  const sp = (await searchParams) || {}

  const { jobs, totalPages, currentPage } = await getJobs(sp)

  const currentQuery = new URLSearchParams()
  Object.entries(sp).forEach(([key, value]) => {
    if (typeof value === "string") {
      currentQuery.set(key, value)
    }
  })

  const createPageLink = (page: number) => {
    const params = new URLSearchParams(currentQuery)
    params.set("page", page.toString())
    return `/jobs?${params.toString()}`
  }

  const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"]
  const domains = [
    "Software Development",
    "Data Science",
    "Marketing",
    "Sales",
    "Finance",
    "HR",
    "Design",
    "Customer Service",
  ]
  const currencies = [
    { label: "Rupee (₹)", value: "₹" },
    { label: "Dollar ($)", value: "$" },
    { label: "Euro (€)", value: "€" },
    { label: "INR", value: "INR" },
    { label: "USD", value: "USD" },
    { label: "EUR", value: "EUR" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">Sarkar Daily Jobs</span>
            </Link>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  {user.role === "job_seeker" && (
                    <Link href="/seeker/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                  )}
                  {user.role === "employer" && (
                    <Link href="/employer/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                  )}
                  <form action="/api/auth/logout" method="POST">
                    <Button type="submit" variant="ghost">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Register</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Find Your Dream Job</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <JobsFilters
              q={sp.q}
              location={sp.location}
              remote={sp.remote}
              currency={sp.currency}
              type={sp.type}
              domain={sp.domain}
              min_salary={sp.min_salary}
            />
          </div>

          {/* Job Listings */}
          <div className="md:col-span-3 space-y-6">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-700">No jobs found matching your criteria.</h2>
                <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {job.company_logo ? (
                          <img
                            src={job.company_logo || "/placeholder.svg"}
                            alt={`${job.company_name} logo`}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg">
                            {job.company_name ? job.company_name[0] : "C"}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <CardDescription className="text-gray-600">{job.company_name || "N/A"}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{job.job_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.is_remote ? "Remote" : job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Posted {new Date(job.posted_at).toLocaleDateString()}
                      </div>
                      {job.domain && <Badge variant="outline">{job.domain}</Badge>}
                    </div>
                    <div className="mt-6 text-right">
                      <Link href={`/jobs/${job.id}`}>
                        <Button>View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-8">
                <Link href={createPageLink(currentPage - 1)} passHref>
                  <Button variant="outline" disabled={currentPage === 1}>
                    Previous
                  </Button>
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Link key={page} href={createPageLink(page)} passHref>
                    <Button variant={page === currentPage ? "default" : "outline"}>{page}</Button>
                  </Link>
                ))}
                <Link href={createPageLink(currentPage + 1)} passHref>
                  <Button variant="outline" disabled={currentPage === totalPages}>
                    Next
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
