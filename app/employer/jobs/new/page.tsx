"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, Plus, ArrowLeft, X, HelpCircle } from "lucide-react"

interface CustomQuestion {
  id: string
  text: string
  isRequired: boolean
}

export default function NewJobPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    experience_required: "",
    salary: "",
    location: "",
    country: "",
    is_remote: false,
    job_type: "",
    domain: "",
    contact_email: "",
  })
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const addCustomQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: Date.now().toString(),
      text: "",
      isRequired: false,
    }
    setCustomQuestions([...customQuestions, newQuestion])
  }

  const updateCustomQuestion = (id: string, field: keyof CustomQuestion, value: string | boolean) => {
    setCustomQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate custom questions
      const validQuestions = customQuestions.filter((q) => q.text.trim() !== "")

      const response = await fetch("/api/employer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          customQuestions: validQuestions,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to post job")
      }

      setSuccess("Job posted successfully!")
      setFormData({
        title: "",
        description: "",
        experience_required: "",
        salary: "",
        location: "",
        country: "",
        is_remote: false,
        job_type: "",
        domain: "",
        contact_email: "",
      })
      setCustomQuestions([])

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/employer/dashboard")
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-6 w-6 mr-2" />
              Post New Job
            </CardTitle>
            <CardDescription>Fill in the details to post a new job opening.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Software Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the job role, responsibilities, and requirements."
                  rows={8}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="e.g., hr@company.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  required
                />
                <p className="text-sm text-gray-600">
                  Selected applicants will be able to contact you at this email address
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience_required">Experience Required</Label>
                  <Input
                    id="experience_required"
                    placeholder="e.g., 2-4 years, Entry-level"
                    value={formData.experience_required}
                    onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (Optional)</Label>
                  <Input
                    id="salary"
                    placeholder="e.g., ₹5-10 LPA, $60k-$80k"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bangalore, New York"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={formData.is_remote}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="e.g., India, USA"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={formData.is_remote}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_remote"
                  checked={formData.is_remote}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_remote: !!checked })}
                />
                <Label htmlFor="is_remote">Remote Job</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger id="job_type">
                      <SelectValue placeholder="Select Job Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Job Domain</Label>
                  <Input
                    id="domain"
                    placeholder="e.g., Software Development, Marketing"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Custom Application Questions</Label>
                    <p className="text-sm text-gray-600">Add questions for applicants to answer when applying</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomQuestion}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {customQuestions.length > 0 && (
                  <div className="space-y-3">
                    {customQuestions.map((question, index) => (
                      <Card key={question.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Question {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomQuestion(question.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Enter your question here..."
                            value={question.text}
                            onChange={(e) => updateCustomQuestion(question.id, "text", e.target.value)}
                            rows={2}
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`required-${question.id}`}
                              checked={question.isRequired}
                              onCheckedChange={(checked) => updateCustomQuestion(question.id, "isRequired", !!checked)}
                            />
                            <Label htmlFor={`required-${question.id}`} className="text-sm">
                              Required question
                            </Label>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Posting Job..." : "Post Job"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
