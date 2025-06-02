import * as React from "react"
import { ChevronsUpDown, Plus, ChevronDown } from "lucide-react"
import { router } from "@inertiajs/react"
import { useAuth } from "@/hooks/use-auth"
import { useRole } from "@/hooks/use-role"
import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export interface Team {
  name: string
  logo: React.ComponentType
  plan: string
  slug: string
}

interface TeamSwitcherProps {
  teams: Team[]
  onTeamSwitch?: (team: { slug: string }) => void
  defaultTeam?: string
}

export function TeamSwitcher({ teams = [], onTeamSwitch, defaultTeam }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const { user } = useAuth()
  const { hasRole } = useRole()
  
  // Ensure we have a valid currentTeam
  const currentTeam = React.useMemo(() => {
    if (!teams.length) return null;
    return teams.find(team => team.slug === defaultTeam) || teams[0];
  }, [teams, defaultTeam]);

  const handleTeamSelect = (team: Team) => {
    router.visit(`/${team.slug}/dashboard`)
    onTeamSwitch?.(team)
  }

  // If no teams are available, show a placeholder
  if (!currentTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Button variant="ghost" className="w-full justify-between" disabled>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">No organizations available</span>
            </div>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center gap-2">
                <currentTeam.logo />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{currentTeam.name}</span>
                  <span className="text-xs text-muted-foreground">{currentTeam.plan}</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.slug}
                onClick={() => handleTeamSelect(team)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <team.logo />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">{team.plan}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            {hasRole(user, 'superadmin') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={route('tenants.index')}>
                    Manage Organizations
                  </a>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
