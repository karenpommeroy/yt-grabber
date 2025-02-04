export enum WorkOrder {
    DedicatedPublicTransportTeam = "10169001",
}

export enum Activity {
    BillableOnsite = "100",
    BillableOffsite = "110",
    JBilling = "170",
    Illness = "600",
    PublicHoliday = "530",
    AnnualHoliday = "500",
    SpecialLeave = "510",
    SpecialCompanyLeave = "520",
}

export enum Project {
    FrequentisPublicTransport = "101690",
    Illness = "999997",
    PublicHoliday = "999998",
    Holiday = "999999",
    Other = "999995",
}

export enum AgressoType {
    Illness = "illness",
    Onsite = "onsite",
    Holiday = "holiday",
    PublicHoliday = "public-holiday",
    Overtime = "overtime",
    Other = "other",
}

export enum AgressoTimeMode {
    AllDay = "all-day",
    Custom = "custom",
    Guess = "guess",
}
