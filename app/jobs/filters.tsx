"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Filter, MapPin, Search, X } from "lucide-react"

type FiltersProps = {
  q?: string
  location?: string
  remote?: string
  currency?: string
  type?: string
  domain?: string
  min_salary?: string
}

export function JobsFilters(props: FiltersProps) {
  const jobTypes = useMemo(
    () => ["Full-time", "Part-time", "Contract", "Internship", "Temporary"],
    []
  )
  const domains = useMemo(
    () => [
      "Software Development",
      "Data Science",
      "Marketing",
      "Sales",
      "Finance",
      "HR",
      "Design",
      "Customer Service",
    ],
    []
  )
  const currencies = useMemo(
    () => [
      { label: "Rupee (₹)", value: "₹" },
      { label: "Dollar ($)", value: "$" },
      { label: "Euro (€)", value: "€" },
      { label: "INR", value: "INR" },
      { label: "USD", value: "USD" },
      { label: "EUR", value: "EUR" },
    ],
    []
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="q">Keywords</Label>
            <div className="relative">
              <Input
                id="q"
                name="q"
                placeholder="Job title, company, keywords"
                defaultValue={props.q || ""}
                className="pl-8"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <Input
                id="location"
                name="location"
                placeholder="City, Country"
                defaultValue={props.location || ""}
                className="pl-8"
              />
              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Job Type</Label>
            <Select defaultValue={props.type || "All Types"} name="type">
              <SelectTrigger id="type">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Types">All Types</SelectItem>
                {jobTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Select defaultValue={props.domain || "All Domains"} name="domain">
              <SelectTrigger id="domain">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Domains">All Domains</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select defaultValue={props.currency || ""} name="currency">
              <SelectTrigger id="currency">
                <SelectValue placeholder="Any currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {currencies.map((c) => (
                  <SelectItem key={c.label} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_salary">Minimum Salary</Label>
            <div className="relative">
              <Input
                id="min_salary"
                name="min_salary"
                type="number"
                placeholder="e.g., 50000"
                defaultValue={props.min_salary || ""}
                className="pl-8"
              />
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remote" name="remote" value="true" defaultChecked={props.remote === "true"} />
            <Label htmlFor="remote">Remote Jobs Only</Label>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
            <Link href="/jobs">
              <Button variant="outline" className="w-full bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}



