"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ApplyButtonProps {
  jobId: number
  hasProfile: boolean
}

interface Resume {
  id: number
  title: string
  file_url: string
  file_name: string
  is_default: boolean
}

interface JobQuestion {
  id: number
  question_text: string
  is_required: boolean
  question_order: number
}

export function ApplyButton({ jobId, hasProfile }: ApplyButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null)
  const [newResumeTitle, setNewResumeTitle] = useState("")
  const [jobQuestions, setJobQuestions] = useState<JobQuestion[]>([])
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (showResumeDialog) {
      fetchResumes()
      fetchJobQuestions()
    }
  }, [showResumeDialog])

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/seeker/resumes")
      if (response.ok) {
        const data = await response.json()
        setResumes(data.resumes || [])
        const defaultResume = data.resumes.find((r: Resume) => r.is_default)
        if (defaultResume) {
          setSelectedResumeId(defaultResume.id.toString())
        } else if (data.resumes.length > 0) {
          setSelectedResumeId(data.resumes[0].id.toString())
        }
      } else {
        setError("Failed to fetch resumes.")
      }
    } catch (err) {
      setError("Failed to fetch resumes.")
    }
  }

  const fetchJobQuestions = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setJobQuestions(data.questions || [])
        // Initialize answers object
        const initialAnswers: Record<number, string> = {}
        data.questions.forEach((q: JobQuestion) => {
          initialAnswers[q.id] = ""
        })
        setQuestionAnswers(initialAnswers)
      }
    } catch (err) {
      console.error("Failed to fetch job questions:", err)
    }
  }

  const handleNewResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.")
        setNewResumeFile(null)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.")
        setNewResumeFile(null)
        return
      }
      setNewResumeFile(file)
      setNewResumeTitle(file.name.replace(".pdf", ""))
      setSelectedResumeId("new")
      setError("")
    } else {
      setNewResumeFile(null)
      setNewResumeTitle("")
      setSelectedResumeId(null)
    }
  }

  const handleApply = async () => {
    if (!hasProfile) {
      toast({
        title: "Profile Incomplete",
        description: "Please complete your job seeker profile before applying.",
        variant: "destructive",
      })
      router.push("/seeker/profile?new=true")
      return
    }

    const requiredQuestions = jobQuestions.filter((q) => q.is_required)
    const missingAnswers = requiredQuestions.filter((q) => !questionAnswers[q.id]?.trim())

    if (missingAnswers.length > 0) {
      setError("Please answer all required questions before applying.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    let resumeToUseId: number | null = null

    try {
      if (selectedResumeId === "new") {
        if (!newResumeFile) {
          throw new Error("No new resume file selected.")
        }
        if (!newResumeTitle.trim()) {
          throw new Error("New resume title is required.")
        }

        const formData = new FormData()
        formData.append("resume", newResumeFile)
        formData.append("title", newResumeTitle)

        const uploadResponse = await fetch("/api/seeker/resumes", {
          method: "POST",
          body: formData,
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Failed to upload new resume.")
        }

        await fetchResumes()
        const uploadedResume = (await (await fetch("/api/seeker/resumes")).json()).resumes.find(
          (r: Resume) => r.file_name === newResumeFile.name && r.title === newResumeTitle,
        )
        if (!uploadedResume) {
          throw new Error("Failed to retrieve ID of newly uploaded resume.")
        }
        resumeToUseId = uploadedResume.id
      } else if (selectedResumeId) {
        resumeToUseId = Number.parseInt(selectedResumeId)
      } else {
        throw new Error("Please select or upload a resume to apply.")
      }

      if (!resumeToUseId) {
        throw new Error("No resume selected or uploaded for application.")
      }

      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: resumeToUseId,
          questionAnswers: questionAnswers,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply for job")
      }

      setSuccess("Application submitted successfully!")
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted.",
        variant: "default",
      })
      setShowResumeDialog(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Application Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setShowResumeDialog(true)} className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
        Apply for this Job
      </Button>

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for this Job</DialogTitle>
            <DialogDescription>
              Complete your application by selecting a resume and answering any required questions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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

            {/* Resume Selection */}
            <div className="space-y-2">
              <Label htmlFor="resume-select">Your Resume</Label>
              {resumes.length === 0 ? (
                <p className="text-sm text-gray-500">No existing resumes. Please upload one below.</p>
              ) : (
                <Select
                  value={selectedResumeId === "new" ? "" : selectedResumeId || ""}
                  onValueChange={(value) => {
                    setSelectedResumeId(value)
                    setNewResumeFile(null)
                    setNewResumeTitle("")
                  }}
                >
                  <SelectTrigger id="resume-select">
                    <SelectValue placeholder="Select an existing resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id.toString()}>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          {resume.title} {resume.is_default && "(Default)"}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>

            {/* Upload New Resume */}
            <div className="space-y-2">
              <Label htmlFor="new-resume-upload">Upload New Resume (PDF only, max 5MB)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="new-resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleNewResumeFileChange}
                  className="flex-1"
                />
                {newResumeFile && (
                  <Input
                    placeholder="Resume Title"
                    value={newResumeTitle}
                    onChange={(e) => setNewResumeTitle(e.target.value)}
                    className="w-1/2"
                  />
                )}
              </div>
              {newResumeFile && (
                <p className="text-sm text-gray-500 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {newResumeFile.name} selected.
                </p>
              )}
            </div>

            {jobQuestions.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <Label className="text-base font-medium">Application Questions</Label>
                  <p className="text-sm text-gray-600 mb-4">Please answer the following questions</p>

                  <div className="space-y-4">
                    {jobQuestions.map((question, index) => (
                      <div key={question.id} className="space-y-2">
                        <Label htmlFor={`question-${question.id}`}>
                          {index + 1}. {question.question_text}
                          {question.is_required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id={`question-${question.id}`}
                          placeholder="Enter your answer here..."
                          value={questionAnswers[question.id] || ""}
                          onChange={(e) =>
                            setQuestionAnswers((prev) => ({
                              ...prev,
                              [question.id]: e.target.value,
                            }))
                          }
                          rows={3}
                          required={question.is_required}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleApply} disabled={loading || (!selectedResumeId && !newResumeFile)}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
