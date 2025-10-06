import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getUserFromToken } from "@/lib/auth"
import { sql } from "@/lib/db"
import {
  Briefcase,
  ArrowLeft,
  Users,
  MapPin,
  Clock,
  Filter,
  ChevronDown,
  FileText,
  Mail,
  GraduationCap,
} from "lucide-react"
import type { Application } from "@/lib/db"

async function getEmployerApplications(employerId: number) {
  try {
    const applications = await sql`
      SELECT 
        a.*,
        j.title as job_title,
        j.location as job_location,
        j.is_remote,
        j.contact_email,
        jsp.name as applicant_name,
        jsp.location as applicant_location,
        jsp.education,
        jsp.resume_url,
        u.email as applicant_email,
        r.title as resume_title,
        r.file_url as resume_file_url
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.seeker_id = u.id
      LEFT JOIN job_seeker_profiles jsp ON a.seeker_id = jsp.user_id
      LEFT JOIN resumes r ON a.resume_id = r.id
      WHERE j.employer_id = ${employerId}
      ORDER BY a.application_date DESC
    `

    return applications as (Application & {
      job_title: string
      job_location: string
      is_remote: boolean
      contact_email: string
      applicant_name: string
      applicant_location: string
      education: string
      resume_url: string
      applicant_email: string
      resume_title: string
      resume_file_url: string
    })[]
  } catch (_) {
    return []
  }
}

export default async function EmployerApplicationsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    redirect("/login")
  }

  const user = await getUserFromToken(token)
  if (!user || user.role !== "employer") {
    redirect("/login")
  }

  const applications = await getEmployerApplications(user.id)

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "applied").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  }

  // Server Component: use mailto anchor instead of window navigation

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
              <Link href="/employer/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <Button type="submit" variant="ghost" formAction="/api/auth/logout">
                  Logout
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Applications</h1>
          <p className="text-gray-600">Review and manage applications for your job postings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filter Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input placeholder="Search by name or email..." />
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="applied">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>
              {applications.length === 0 ? "No applications received yet" : `${applications.length} applications`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">Applications will appear here when job seekers apply to your jobs</p>
                <Link href="/employer/jobs/new">
                  <Button>Post Your First Job</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Collapsible key={application.id}>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-lg text-gray-900">
                              {application.applicant_name || "Anonymous"}
                            </h4>
                            <Badge
                              variant={
                                application.status === "accepted"
                                  ? "default"
                                  : application.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {application.status}
                            </Badge>
                          </div>

                          {(application.resume_file_url || application.resume_url) && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={application.resume_file_url || application.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                {application.resume_title || "Resume"}
                              </a>
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {application.status === "accepted" && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={`mailto:${application.applicant_email}?subject=${encodeURIComponent(
                                  `Regarding your application for ${application.job_title}`,
                                )}`}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Contact
                              </a>
                            </Button>
                          )}

                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ChevronDown className="h-4 w-4" />
                              Details
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <strong>Applied for:</strong> {application.job_title}
                        </p>
                        <p className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {new Date(application.application_date).toLocaleDateString()}
                        </p>
                      </div>

                      <CollapsibleContent className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="font-medium">Email:</span>
                              <span className="ml-2">{application.applicant_email}</span>
                            </div>

                            {application.applicant_location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="font-medium">Location:</span>
                                <span className="ml-2">{application.applicant_location}</span>
                              </div>
                            )}

                            {application.education && (
                              <div className="flex items-start">
                                <GraduationCap className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                                <span className="font-medium">Education:</span>
                                <span className="ml-2">{application.education}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="font-medium">Job Location:</span>
                              <span className="ml-2">
                                {application.is_remote ? "Remote" : application.job_location || "Not specified"}
                              </span>
                            </div>

                            {application.contact_email && (
                              <div>
                                <span className="font-medium">Contact Email:</span>
                                <span className="ml-2">{application.contact_email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {application.status === "applied" && (
                          <div className="flex space-x-2 mt-4 pt-4 border-t">
                            <Link href={`/employer/jobs/${application.job_id}`}>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                Review Application
                              </Button>
                            </Link>
                            <Link href={`/employer/jobs/${application.job_id}`}>
                              <Button variant="outline" size="sm">
                                View Job Details
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
