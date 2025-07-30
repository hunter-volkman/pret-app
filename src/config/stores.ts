// Pret A Manger store configurations
export interface Store {
  id: string
  name: string
  address: string
  coords: { lat: number; lng: number }
  stockMachineId: string
  tempMachineId: string
  tempPartId: string
  timezone: string
}

export const STORES: Store[] = [
  {
    id: '70yfjlr1vp',
    name: '36th & 5th',
    address: '389 5th Ave, New York, NY 10016',
    coords: { lat: 40.7497832, lng: -73.9833294 },
    stockMachineId: 'a7c5717d-f48e-4ac8-b179-7c7aa73571de',
    tempMachineId: '948e0595-d307-425f-bd55-108e52046c2b',
    tempPartId: '5fb0c449-9955-4963-9d1b-ab947cb05554',
    timezone: 'America/New_York'
  },
  {
    id: 'z2dxkk8fk2',
    name: 'Union Square',
    address: '857 Broadway, New York, NY 10003',
    coords: { lat: 40.737372, lng: -73.9931299 },
    stockMachineId: '467ae11d-077b-4a55-ad59-49c5a0fd7d1a',
    tempMachineId: '27971efd-baaa-4cb5-b5d0-2b5468daf0b4',
    tempPartId: 'f4981097-a2fd-4998-91ae-20f2c9e9f5f1',
    timezone: 'America/New_York'
  },
  {
    id: 'nuee6e0yiy',
    name: 'Westwood/UCLA',
    address: '10906 Le Conte Ave, Los Angeles, CA 90024',
    coords: { lat: 34.06352, lng: -118.4482214 },
    stockMachineId: '55fc689f-bb6d-4654-ba0e-273335bc7a42',
    tempMachineId: '4330c1e3-6a68-487c-8288-ce0124772bce',
    tempPartId: 'bddd09bd-7c2d-4a45-98af-0c524b1a9959',
    timezone: 'America/Los_Angeles'
  },
  {
    id: 'rpo84u6781',
    name: 'Century City Mall',
    address: '10250 Santa Monica Blvd Suite 1300, Los Angeles, CA 90067',
    coords: { lat: 34.0574907, lng: -118.4209066 },
    stockMachineId: '1ceaf6ee-c926-4297-8fb6-3e702ed8e2eb',
    tempMachineId: 'fc6778ff-e3a0-4295-a52d-d92580fc2e81',
    tempPartId: '92c416f8-b878-4eee-9725-a40926f5fd2c',
    timezone: 'America/Los_Angeles'
  },
  {
    id: 'x9lduz4xp2',
    name: '11th & F',
    address: '1155 F St NW, Washington, DC 20004',
    coords: { lat: 38.897684, lng: -77.0300862 },
    stockMachineId: '164a39ed-5a74-4786-9e71-c2f719fc3b22',
    tempMachineId: 'c65f15f3-21a9-46ef-9090-cd18c07178b5',
    tempPartId: '3d178064-e159-4268-ab22-45689249dda6',
    timezone: 'America/New_York'
  },
  {
    id: '22we5oy6m8',
    name: 'Union Station',
    address: '50 Massachusetts Ave NE, Washington, DC 20002',
    coords: { lat: 38.8975066, lng: -77.0067488 },
    stockMachineId: 'fc4be03e-3e05-4cef-8e4c-3b68ffbd627a',
    tempMachineId: 'de7e0050-24b3-442e-919a-a580a5e91213',
    tempPartId: 'fd9b1333-92bf-417d-b93f-5e121e86d3cf',
    timezone: 'America/New_York'
  }
]

// Demo mode toggle
export const IS_DEMO = localStorage.getItem('demo-mode') === 'true'
export const toggleDemo = () => {
  localStorage.setItem('demo-mode', (!IS_DEMO).toString())
  window.location.reload()
}