#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, BytesN, Env, Map};

#[contract]
pub struct MediSyncRegistry;

#[contractimpl]
impl MediSyncRegistry {
    pub fn register_record(env: Env, hash: BytesN<32>, owner: Address) -> bool {
        owner.require_auth();
        let mut store: Map<BytesN<32>, Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("REG"))
            .unwrap_or_else(|| Map::new(&env));
        if store.contains_key(hash.clone()) {
            return false;
        }
        store.set(hash, owner);
        env.storage().instance().set(&symbol_short!("REG"), &store);
        true
    }

    pub fn verify_record(env: Env, hash: BytesN<32>) -> bool {
        let store: Map<BytesN<32>, Address> = env
            .storage()
            .instance()
            .get(&symbol_short!("REG"))
            .unwrap_or_else(|| Map::new(&env));
        store.contains_key(hash)
    }
}
