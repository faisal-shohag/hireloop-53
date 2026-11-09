'use client';
import { useRouter } from 'next/navigation';

const JobCard = ({job}: {job: { _id: string; title: string; companyName: string; location: string; isRemote: boolean }}) => {

    const router = useRouter();
    const handleViewJobDetail = (jobId: string) => {
        router.push(`/browse-jobs/${jobId}`)
    }

    return (
        <li key={job._id} onClick={() => handleViewJobDetail(job._id)} className="surface-card p-6">
            <h3 className="font-heading text-lg font-semibold text-[#EDEDEF]">
                {job.title}
            </h3>
            <p className="mt-1 text-sm text-[#6E6E78]">
                {job.companyName} • {job.location}
                {job.isRemote ? " (Remote)" : ""}
            </p>
        </li>
    );
};

export default JobCard;