#![no_std]
#![no_main]

use revm::{
    db::CacheState,
    interpreter::{CreateScheme, InstructionResult},
    primitives::{calc_excess_blob_gas, keccak256, Bytecode, Env, SpecId, TransactTo, U256},
    Evm,
    StorageOverride
};

use revm_inspectors::CallKind;

use core::hash::Hash;

use alloc::string::String;

use alloy_primitives::{Address, Uint, Bytes, Log};

use alloy_eips::eip2930::AccessList;

use alloc::fmt::Error;

use hashbrown::HashMap;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

extern crate alloc;
use alloc::vec::Vec;
use crate::alloc::string::ToString;

zkm_runtime::entrypoint!(main);

pub fn main() {
   
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulationRequest {
    pub chain_id: u64,
    pub from: Address,
    pub to: Address,
    pub data: Option<Bytes>,
    pub gas_limit: u64,
    pub value: Option<PermissiveUint>,
    pub access_list: Option<AccessList>,
    pub block_number: Option<u64>,
    pub block_timestamp: Option<u64>,
    pub state_overrides: Option<HashMap<Address, StateOverride>>,
    pub format_trace: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SimulationResponse {
    pub simulation_id: u64,
    pub gas_used: u64,
    pub block_number: u64,
    pub success: bool,
    pub trace: Vec<CallTrace>,
    pub formatted_trace: Option<String>,
    pub logs: Vec<Log>,
    pub exit_reason: InstructionResult,
    pub return_data: Bytes,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StatefulSimulationRequest {
    pub chain_id: u64,
    pub gas_limit: u64,
    pub block_number: Option<u64>,
    pub block_timestamp: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StatefulSimulationResponse {
    pub stateful_simulation_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StatefulSimulationEndResponse {
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StateOverride {
    pub balance: Option<PermissiveUint>,
    pub nonce: Option<u64>,
    pub code: Option<Bytes>,
    #[serde(flatten)]
    pub state: Option<State>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum State {
    Full {
        state: HashMap<Hash, PermissiveUint>,
    },
    #[serde(rename_all = "camelCase")]
    Diff {
        state_diff: HashMap<Hash, PermissiveUint>,
    },
}

impl From<State> for StorageOverride {
    fn from(value: State) -> Self {
        let (slots, diff) = match value {
            State::Full { state } => (state, false),
            State::Diff { state_diff } => (state_diff, true),
        };

        StorageOverride {
            slots: slots
                .into_iter()
                .map(|(key, value)| (key, value.into()))
                .collect(),
            diff,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CallTrace {
    pub call_type: CallKind,
    pub from: Address,
    pub to: Address,
    pub value: Uint,
}

#[derive(Debug, Default, Clone, Copy, Serialize, PartialEq)]
#[serde(transparent)]
pub struct PermissiveUint(pub Uint);

impl From<PermissiveUint> for Uint {
    fn from(value: PermissiveUint) -> Self {
        value.0
    }
}

impl<'de> Deserialize<'de> for PermissiveUint {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // Accept value in hex or decimal formats
        let value = String::deserialize(deserializer)?;
        let parsed = if value.starts_with("0x") {
            Uint::from_str(&value).map_err(serde::de::Error::custom)?
        } else {
            Uint::from_dec_str(&value).map_err(serde::de::Error::custom)?
        };
        Ok(Self(parsed))
    }
}

async fn run(
    evm: &mut Evm<'_, EXT, DB>,
    transaction: SimulationRequest,
    commit: bool,
) -> Result<SimulationResponse, Error> {
    for (address, state_override) in transaction.state_overrides.into_iter().flatten() {
        evm.override_account(
            address,
            state_override.balance.map(Uint::from),
            state_override.nonce,
            state_override.code,
            state_override.state.map(StorageOverride::from),
        )?;
    }

    let call = CallRawRequest {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value.map(Uint::from),
        data: transaction.data,
        access_list: transaction.access_list,
        format_trace: transaction.format_trace.unwrap_or_default(),
    };
    let result = if commit {
        evm.call_raw_committing(call, transaction.gas_limit).await?
    } else {
        evm.call_raw(call).await?
    };

    Ok(SimulationResponse {
        simulation_id: 1,
        gas_used: result.gas_used,
        block_number: result.block_number,
        success: result.success,
        trace: result
            .trace
            .unwrap_or_default()
            .arena
            .into_iter()
            .map(CallTrace::from)
            .collect(),
        logs: result.logs,
        exit_reason: result.exit_reason,
        formatted_trace: result.formatted_trace,
        return_data: result.return_data,
    })
}

pub async fn simulate(transaction: SimulationRequest) {
    let fork_url = "https://polygon.llamarpc.com";
    let mut evm = Evm::new(
        None,
        fork_url,
        transaction.block_number,
        transaction.gas_limit,
        true,
        "UUCQTXWWXVI91DXYY82JNWWIN6H6EE7S2U",
    );

    if let Some(timestamp) = transaction.block_timestamp {
        evm.set_block_timestamp(timestamp)
            .await
            .expect("failed to set block timestamp");
    }

    let response = run(&mut evm, transaction, false).await?;

    //Ok(warp::reply::json(&response))
    zkm_runtime::io::commit::<[u8; 32]>(&response);
}

