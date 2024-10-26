# CHANGELOG

## 2.0.1

- Make compatible with Token HUD Core 2.0.3
- (Note that there is a bug in HUD Core 2.0.3 which generates an error in the console, but the selected action has completed.)

## 1.7.1

- Mark as compatible with Cyphersystem 3.1.0 and Foundry V12

## 1.7.0

- Make compatible with Token Action HUD Core v1.5.x

## 1.6.1

- Change the 'nestId' values so that it works on Foundry 11 correctly.

## 1.6.0

- Ensure compatibility with Token-Action-Hude Core version 1.4.17 and later.

## 1.5.0

- Add tooltips:

- Pools show "current / maximum (edge)"
- Skills and Abilities show the item's description

## 1.4.1

- Mark compatible with Foundry 11 (299)

## 1.4.0

- Ensure compatibility with HUD Core 1.4.0
- Naming convention of this module has changed to try and align with the compatible HUD-Core version.

## 0.5.2

- Prevent endless loop of actor updates when GM and player select the same token.
- If 'Hide Archive' is not selected on the Actor, then any archived entries in the HUD will be shown in disabled state.

## 0.5.1

- Get right-click working again with HUD Core 1.3
- Force update of HUD when (de)selecting TAG or RECURSION (it actually updates on any change to the Actor).

## 0.5

- Make changes to become compatible with Token Action HUD Core version 1.3. (Note that selecting multiple tokens will not provide a HUD.)
- Use correct method for honouring the HUD Core option 'Open Item Sheet on Right-Click'.
- Change `doRegisterDefaultFlags` to return the default structure.

## 0.4.1

- Bump compatible version of HUD Core to 1.2 so that the module will work again.

## 0.4

- Support showing which recursions and tags are currently checked.
- Add icons to the buttons using the icon from the underyling item.
- Manually honour the HUD Core option "Display Icons".
- Open Item sheet on Right-Click (the Core option doesn't affect this behaviour).

## 0.3

- Add the Tags ("@") HUD title to support Recursions and Tags.
- Do not display archived items if the Actor's 'Hide Archive' setting is checked.
- General tidy up of old code.

## 0.2

- Insert translations available in the Cypher System language tables (there is no translation entry for "Pools", so I've used "Pool" for that purpose.)

## 0.1

- First version which provides basic support for Cypher System player character Actors.