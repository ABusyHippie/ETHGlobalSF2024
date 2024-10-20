# Description and Acknowledgements

This is a proof of concept for how verifiable computation of transaction simulation would work.

We are building using a preexisting solution: [Temper](https://github.com/EnsoFinance/temper). **We are using this solution as a reference implementation and this project is not considered part of the submission**

The purpose of using preexisitng code is to be able to run the simulation in a zkVM in order to prove the execution of an arbitrary program. The attempt at mapping the existing program code to the zkVM is custom and located [here](https://github.com/ABusyHippie/ETHGlobalSF2024/blob/backend/zkm-project-template/guest-program/simulate/src/main.rs).


