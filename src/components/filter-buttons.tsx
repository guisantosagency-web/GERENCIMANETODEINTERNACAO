"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { MapPin, Target, Calendar, CalendarDays, X, Check, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterButtonsProps {
  cities: string[]
  destinations: string[]
  procedencias: string[]
  months: string[]
  years: string[]
  selectedCity: string | null
  selectedDestination: string | null
  selectedProcedencia: string | null
  selectedMonth: string | null
  selectedYear: string | null
  onCityChange: (city: string | null) => void
  onDestinationChange: (destination: string | null) => void
  onProcedenciaChange: (procedencia: string | null) => void
  onMonthChange: (month: string | null) => void
  onYearChange: (year: string | null) => void
}

export function FilterButtons({
  cities,
  destinations,
  procedencias,
  months,
  years,
  selectedCity,
  selectedDestination,
  selectedProcedencia,
  selectedMonth,
  selectedYear,
  onCityChange,
  onDestinationChange,
  onProcedenciaChange,
  onMonthChange,
  onYearChange,
}: FilterButtonsProps) {
  const [openCity, setOpenCity] = useState(false)
  const [openDestination, setOpenDestination] = useState(false)
  const [openProcedencia, setOpenProcedencia] = useState(false)
  const [openMonth, setOpenMonth] = useState(false)
  const [openYear, setOpenYear] = useState(false)

  const hasFilters = selectedCity || selectedDestination || selectedProcedencia || selectedMonth || selectedYear

  const clearAllFilters = () => {
    onCityChange(null)
    onDestinationChange(null)
    onProcedenciaChange(null)
    onMonthChange(null)
    onYearChange(null)
  }

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      {/* Cidade Filter */}
      <Popover open={openCity} onOpenChange={setOpenCity}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedCity ? "default" : "outline"}
            className={cn(
              "w-auto justify-between gap-2 rounded-xl h-12 px-4 transition-all duration-200 whitespace-nowrap",
              selectedCity
                ? "bg-gradient-to-r from-primary to-secondary shadow-indicator border-0"
                : "bg-accent/50 border-border/50 hover:bg-accent hover:border-primary/30",
            )}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{selectedCity || "Cidade"}</span>
            </div>
            {selectedCity && (
              <X
                className="h-3.5 w-3.5 ml-1 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onCityChange(null)
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 rounded-xl border-border/50 shadow-card-hover" align="start">
          <Command className="rounded-xl">
            <CommandInput placeholder="Buscar cidade..." className="h-11" />
            <CommandList className="max-h-[280px]">
              <CommandEmpty className="py-4 text-sm text-muted-foreground">Nenhuma cidade encontrada.</CommandEmpty>
              <CommandGroup>
                {cities?.map((city) => (
                  <CommandItem
                    key={city}
                    onSelect={() => {
                      onCityChange(city === selectedCity ? null : city)
                      setOpenCity(false)
                    }}
                    className="rounded-lg mx-1 my-0.5"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 text-primary", selectedCity === city ? "opacity-100" : "opacity-0")}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Destino Filter */}
      <Popover open={openDestination} onOpenChange={setOpenDestination}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedDestination ? "default" : "outline"}
            className={cn(
              "w-auto justify-between gap-2 rounded-xl h-12 px-4 transition-all duration-200 whitespace-nowrap",
              selectedDestination
                ? "bg-gradient-to-r from-primary to-secondary shadow-indicator border-0"
                : "bg-accent/50 border-border/50 hover:bg-accent hover:border-primary/30",
            )}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="font-medium">{selectedDestination || "Destino"}</span>
            </div>
            {selectedDestination && (
              <X
                className="h-3.5 w-3.5 ml-1 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDestinationChange(null)
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 rounded-xl border-border/50 shadow-card-hover" align="start">
          <Command className="rounded-xl">
            <CommandInput placeholder="Buscar destino..." className="h-11" />
            <CommandList className="max-h-[280px]">
              <CommandEmpty className="py-4 text-sm text-muted-foreground">Nenhum destino encontrado.</CommandEmpty>
              <CommandGroup>
                {destinations?.map((dest) => (
                  <CommandItem
                    key={dest}
                    onSelect={() => {
                      onDestinationChange(dest === selectedDestination ? null : dest)
                      setOpenDestination(false)
                    }}
                    className="rounded-lg mx-1 my-0.5"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-primary",
                        selectedDestination === dest ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {dest}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Procedência Filter */}
      <Popover open={openProcedencia} onOpenChange={setOpenProcedencia}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedProcedencia ? "default" : "outline"}
            className={cn(
              "w-auto justify-between gap-2 rounded-xl h-12 px-4 transition-all duration-200 whitespace-nowrap",
              selectedProcedencia
                ? "bg-gradient-to-r from-primary to-secondary shadow-indicator border-0"
                : "bg-accent/50 border-border/50 hover:bg-accent hover:border-primary/30",
            )}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-medium">{selectedProcedencia || "Procedência"}</span>
            </div>
            {selectedProcedencia && (
              <X
                className="h-3.5 w-3.5 ml-1 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onProcedenciaChange(null)
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0 rounded-xl border-border/50 shadow-card-hover" align="start">
          <Command className="rounded-xl">
            <CommandInput placeholder="Buscar procedência..." className="h-11" />
            <CommandList className="max-h-[280px]">
              <CommandEmpty className="py-4 text-sm text-muted-foreground">
                Nenhuma procedência encontrada.
              </CommandEmpty>
              <CommandGroup>
                {procedencias?.map((proc) => (
                  <CommandItem
                    key={proc}
                    onSelect={() => {
                      onProcedenciaChange(proc === selectedProcedencia ? null : proc)
                      setOpenProcedencia(false)
                    }}
                    className="rounded-lg mx-1 my-0.5"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-primary",
                        selectedProcedencia === proc ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {proc}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Mês Filter */}
      <Popover open={openMonth} onOpenChange={setOpenMonth}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedMonth ? "default" : "outline"}
            className={cn(
              "w-auto justify-between gap-2 rounded-xl h-12 px-4 transition-all duration-200 whitespace-nowrap",
              selectedMonth
                ? "bg-gradient-to-r from-primary to-secondary shadow-indicator border-0"
                : "bg-accent/50 border-border/50 hover:bg-accent hover:border-primary/30",
            )}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">{selectedMonth || "Mês"}</span>
            </div>
            {selectedMonth && (
              <X
                className="h-3.5 w-3.5 ml-1 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onMonthChange(null)
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-0 rounded-xl border-border/50 shadow-card-hover" align="start">
          <Command className="rounded-xl">
            <CommandList className="max-h-[320px]">
              <CommandGroup>
                {months?.map((month) => (
                  <CommandItem
                    key={month}
                    onSelect={() => {
                      onMonthChange(month === selectedMonth ? null : month)
                      setOpenMonth(false)
                    }}
                    className="rounded-lg mx-1 my-0.5"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 text-primary", selectedMonth === month ? "opacity-100" : "opacity-0")}
                    />
                    {month}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Ano Filter */}
      <Popover open={openYear} onOpenChange={setOpenYear}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedYear ? "default" : "outline"}
            className={cn(
              "w-auto justify-between gap-2 rounded-xl h-12 px-4 transition-all duration-200 whitespace-nowrap",
              selectedYear
                ? "bg-gradient-to-r from-primary to-secondary shadow-indicator border-0"
                : "bg-accent/50 border-border/50 hover:bg-accent hover:border-primary/30",
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="font-medium">{selectedYear || "Ano"}</span>
            </div>
            {selectedYear && (
              <X
                className="h-3.5 w-3.5 ml-1 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onYearChange(null)
                }}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[120px] p-0 rounded-xl border-border/50 shadow-card-hover" align="start">
          <Command className="rounded-xl">
            <CommandList>
              <CommandGroup>
                {years?.map((year) => (
                  <CommandItem
                    key={year}
                    onSelect={() => {
                      onYearChange(year === selectedYear ? null : year)
                      setOpenYear(false)
                    }}
                    className="rounded-lg mx-1 my-0.5"
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4 text-primary", selectedYear === year ? "opacity-100" : "opacity-0")}
                    />
                    {year}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12 px-4 w-auto justify-start font-bold whitespace-nowrap"
        >
          <X className="h-4 w-4 mr-2" />
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
