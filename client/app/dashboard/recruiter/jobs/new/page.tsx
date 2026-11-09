"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PageContainer, PageHeader, SectionCard } from "@/components/dashboard/page-shell"
import { Field } from "@/components/shared/field"
import { PillGroup } from "@/components/shared/pill-group"
import { Briefcase, Calendar, MapPin } from "lucide-react"
import { createJob } from "@/lib/api/jobs"
import {
    JOB_CATEGORIES,
    JOB_TYPES,
    SALARY_FREQUENCIES,
    type JobFormData,
    type JobType,
} from "@/lib/types/jobs"
import { toast } from "@/components/ui/toast"
import { useRouter } from "next/navigation"

const inputClass =
    "surface-field focus-visible:ring-[#5C53FE]/30"

export default function NewJobPage() {
    const [form, setForm] = useState<JobFormData>({
        title: "",
        companyName: "",
        category: "",
        jobType: "full-time",
        isRemote: false,
        location: "",
        deadline: "",
        minSalary: "",
        maxSalary: "",
        salaryFrequency: "per hour",
        responsibilities: "",
        requirements: "",
        applicants: 0,
        status: "active",
    })

    const router = useRouter()

    // Generic flat setter so every field is just setField("key")(value).
    const set =
        <K extends keyof JobFormData>(key: K) =>
            (value: JobFormData[K]) =>
                setForm((prev) => ({ ...prev, [key]: value }))

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const jobData: JobFormData = { ...form }
        console.log("new job form data:", jobData)
        // TODO: wire into the backend (`POST /jobs` or similar).

        const result = await createJob(jobData);
        if(result.insertedId){
            console.log("createJob result:", result);
            toast.add({
                title: "Job created",
                description: "The job has been successfully created.",
            })
            router.push('/dashboard/recruiter/jobs')
        }

    }

    return (
        <PageContainer width="narrow">
            <PageHeader
                overline="Create New Listing"
                title="Post a New Job"
                subtitle="Fill in the position specifications to attract qualified talent across our network."
            />

            <form id="new-job-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* 1. Basic Information */}
                <SectionCard index={1} title="Basic Information">
                    <div className="flex flex-col gap-5">
                        {/* Job Title */}
                        <Field label="Job title" htmlFor="title">
                            <Input
                                id="title"
                                name="title"
                                required
                                minLength={3}
                                maxLength={80}
                                value={form.title}
                                onChange={(e) => set("title")(e.target.value)}
                                placeholder="e.g. Senior Product Designer"
                                className={inputClass}
                            />
                        </Field>

                        {/* Company Name & Job Category */}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Company name" htmlFor="companyName">
                                <div className="relative">
                                    <Briefcase
                                        aria-hidden
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50"
                                    />
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        required
                                        value={form.companyName}
                                        onChange={(e) => set("companyName")(e.target.value)}
                                        placeholder="Acme Inc."
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </Field>
                            <Field label="Job category" htmlFor="category">
                                <Select
                                    value={form.category || ''}
                                    onValueChange={(value) => set("category")(value ?? "")}
                                >
                                    <SelectTrigger id="category" className={`${inputClass} w-full`}>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JOB_CATEGORIES.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>

                        {/* Job Type */}
                        <fieldset className="flex flex-col gap-2">
                            <legend className="text-sm text-[#EDEDEF]/80">Job type</legend>
                            <PillGroup
                                name="job-type"
                                value={form.jobType}
                                onChange={(value) => set("jobType")(value as JobType)}
                                options={JOB_TYPES.map((type) => ({ value: type, label: type }))}
                                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                                pillClassName="h-11 justify-center capitalize"
                            />
                        </fieldset>
                    </div>
                </SectionCard>

                {/* 2. Location, Compensation & Timeline */}
                <SectionCard index={2} title="Location, Compensation &amp; Timeline">
                    <div className="flex flex-col gap-5">
                        {/* Remote Work Allowed (isRemote) */}
                        <div className="flex items-center justify-between gap-4 rounded-lg border surface-field p-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="isRemote" className="text-white/90">
                                    Remote work allowed
                                </Label>
                                <p className="text-xs text-white/50">
                                    Enable worldwide or distributed candidate applications
                                </p>
                            </div>
                            <Switch
                                id="isRemote"
                                checked={form.isRemote}
                                onCheckedChange={(checked) => set("isRemote")(checked)}
                            />
                        </div>

                        {/* Job Location & Application Deadline */}
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Job location" htmlFor="location" required hint="Required">
                                <div className="relative">
                                    <MapPin
                                        aria-hidden
                                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/50"
                                    />
                                    <Input
                                        id="location"
                                        name="location"
                                        required={!form.isRemote}
                                        value={form.location}
                                        onChange={(e) => set("location")(e.target.value)}
                                        placeholder="e.g. New York, USA"
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </Field>
                            <Field label="Application deadline" htmlFor="deadline">
                                <div className="relative">
                                    <Calendar
                                        aria-hidden
                                        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/50"
                                    />
                                    <Input
                                        id="deadline"
                                        name="deadline"
                                        type="date"
                                        value={form.deadline}
                                        onChange={(e) => set("deadline")(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </Field>
                        </div>

                        {/* Salary Range (minSalary & maxSalary) */}
                        <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                            <Field label="Min salary / rate" htmlFor="minSalary">
                                <Input
                                    id="minSalary"
                                    name="minSalary"
                                    type="number"
                                    min={0}
                                    required
                                    placeholder="25"
                                    value={form.minSalary}
                                    onChange={(e) => set("minSalary")(e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Max salary / rate" htmlFor="maxSalary">
                                <Input
                                    id="maxSalary"
                                    name="maxSalary"
                                    type="number"
                                    min={0}
                                    required
                                    placeholder="40"
                                    value={form.maxSalary}
                                    onChange={(e) => set("maxSalary")(e.target.value)}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Frequency" htmlFor="salaryFrequency">
                                <Select
                                    value={form.salaryFrequency}
                                    onValueChange={(value) => set("salaryFrequency")(value ?? "")}
                                >
                                    <SelectTrigger id="salaryFrequency" className={`${inputClass} w-full`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SALARY_FREQUENCIES.map((frequency) => (
                                            <SelectItem key={frequency} value={frequency}>
                                                {frequency}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>
                    </div>
                </SectionCard>

                {/* 3. Responsibilities & Requirements */}
                <SectionCard index={3} title="Responsibilities &amp; Requirements">
                    <div className="flex flex-col gap-5">
                        <Field label="Key responsibilities" htmlFor="responsibilities">
                            <Textarea
                                id="responsibilities"
                                name="responsibilities"
                                required
                                rows={5}
                                maxLength={2000}
                                placeholder="Describe the key responsibilities of the role…"
                                value={form.responsibilities}
                                onChange={(e) => set("responsibilities")(e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Qualifications &amp; requirements" htmlFor="requirements">
                            <Textarea
                                id="requirements"
                                name="requirements"
                                required
                                rows={5}
                                maxLength={2000}
                                placeholder={"• 3+ years of experience with…\n• Solid understanding of…"}
                                value={form.requirements}
                                onChange={(e) => set("requirements")(e.target.value)}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </SectionCard>
                <section>
                    <Button type="submit" form="new-job-form" className="btn-brand">
                        <Briefcase aria-hidden />
                        Publish Job
                    </Button>
                </section>
            </form>
        </PageContainer>
    )
}
