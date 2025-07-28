import { useStore } from '../stores/store'
import { StoreCard } from '../components/StoreCard'

export function StoresView() {
  const { stores, selectedStores, toggleStoreSelection, setCurrentStore, setCurrentView } = useStore()
  
  const handleStoreClick = (store: any) => {
    setCurrentStore(store)
    setCurrentView('camera')
  }
  
  return (
    <div className="p-6 pb-28">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Locations</h2>
        <p className="text-gray-600">Monitor and manage your store network</p>
      </div>
      
      <div className="space-y-6">
        {stores.map(store => (
          <StoreCard
            key={store.id}
            store={store}
            isSelected={selectedStores.has(store.id)}
            onToggle={() => toggleStoreSelection(store.id)}
            onClick={() => handleStoreClick(store)}
          />
        ))}
      </div>
    </div>
  )
}