"use client";

import { ProjectsList } from "@/components/projects/projects-list";

interface ProjectsClientWrapperProps {
  projects: any[];
  users: any[];
  portfolios: any[];
}

export function ProjectsClientWrapper({
  projects,
  users,
  portfolios,
}: ProjectsClientWrapperProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectsList projects={projects} users={users} portfolios={portfolios} />
    </div>
  );
}
