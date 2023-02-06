/* TOKEN ACTION HUD DND5E CONFIG.JS */
/*
const coreModulePath = '../../token-action-hud-core/scripts/token-action-hud-core.min.js'
const coreModule = await import(coreModulePath)
const CoreActionHandler = coreModule.ActionHandler
//const CoreActionListExtender = coreModule.ActionListExtender
const CoreCategoryManager = coreModule.CategoryManager
//export const CorePreRollHandler = coreModule.PreRollHandler
const CoreRollHandler = coreModule.RollHandler
const CoreSystemManager = coreModule.SystemManager
//const CoreUtils = coreModule.Utils
//const Logger = coreModule.Logger
*/

// For DEBUGGING
import { ActionHandler   } from '../../token-action-hud-core/scripts/action-handlers/action-handler.js'
import { CategoryManager } from '../../token-action-hud-core/scripts/category-manager.js'
import { RollHandler     } from '../../token-action-hud-core/scripts/roll-handlers/roll-handler.js'
import { SystemManager   } from '../../token-action-hud-core/scripts/system-manager.js'
import { Utils           } from '../../token-action-hud-core/scripts/utilities/utils.js'
//export const CorePreRollHandler = coreModule.PreRollHandler
//const ActionListExtender = coreModule.ActionListExtender
//const CoreUtils = coreModule.Utils
//const Logger = coreModule.Logger


/* ACTIONS */

/*
ActionList 
{
    "tokenId": "Normally token._id"
    "actionId": "Normally token.actor._id"
    "categories": []
}

A category:
{
    "id": 'Used for filtering',
    "name": 'Category title',
    "subcategories": []
}

A subcategory:
{
    id: 'Not used currently',
    name: 'Subcategory title',
    info1: 'Extra information to display alongside the category',
    actions: [],
    subcategories: []
}

An action:
    {
        name: "The name of the item",
        info1: "",
        info2: "",
        cssClass: "",
        encodedValue: "";
    }
*/

class MyActionHandler extends ActionHandler {
    constructor(categoryManager) {
        super(categoryManager);
    }

    /** @override */
    async buildSystemActions(character, subcategoryIds) {
        const token = character?.token;
        if (!token) return;
        let tokenId = token.id;
        let actor = character?.actor;
        if (!actor) return;
        
        if (actor.type !== 'pc') {
          return;
        }        

        this._getPools(actor, tokenId, { id: 'pools', type: 'system' })
        this._getSkills(actor, tokenId, { id: 'skills', type: 'system' })
        this._getCombat(actor, tokenId, { id: 'combat', type: 'system' })
        this._getAbilities(actor, tokenId, { id: 'abilities', type: 'system' })
      
        //if (settings.get("showHudTitle")) result.hudTitle = token.name;
    }

    _getPools(actor, tokenId, parent) {
        // three entries in this list, one per pool.
        let actions = [];
    
        // Pools
        for (const key of [ "might", "speed", "intellect" ]) {
            actions.push({
                id: key,
                name: game.i18n.localize(`CYPHERSYSTEM.${key.capitalize()}`),
                encodedValue: ["pool", actor.id, tokenId, key.capitalize()].join(this.delimiter),
                //icon: 
                selected: true
            });
        }
        /*
        // Can't roll from the ADDITIONAL POOL at the moment; but keep for later use
        if (actor.system.settings.general.additionalPool.active) {
            result.push({
                name: actor.system.settings.general.additionalPool.label || game.i18n.localize(`CYPHERSYSTEM.AdditionalPool`),
                encodedValue: ["pool", tokenId, "additional"].join(this.delimiter),
              });  
        }
        */
        this.addActionsToActionList(actions, parent);
    }

    _getCombat(actor, tokenId, parent) {
        // just one long list of actions for the combat category
        const actions = actor.items.filter( item => item.type === 'attack').map( item => { return {
            id: item.name,
            name: item.name,
            encodedValue: ["attack", actor.id, tokenId, item.id].join(this.delimiter),
            //icon: ,
            selected: true
        }})
        this.addActionsToActionList(actions, parent);
    }

    createList(parent, actor, tokenId, itemtype, sorting, label) {
        // create one sublist
        let actions = [];
        for (const item of actor.items.filter( item => item.type === itemtype && item.system.settings.general.sorting === sorting)) {
            actions.push({
                name: item.name,
                encodedValue: [itemtype, actor.id, tokenId, item.id].join(this.delimiter),
            });
        }
        if (actions.length) {
            const subcat = { id: sorting, name: Utils.i18n(label), type: 'system-derived'};
            this.addSubcategoryToActionList(parent, subcat);
            this.addActionsToActionList(actions, subcat);
        }
    }

    _getSkills(actor, tokenId, parent) {
        // up to four groups of skills
        const table = {
            Skill:      actor.system.settings.skills.labelCategory1 || 'CYPHERSYSTEM.Skills',
            SkillTwo:   actor.system.settings.skills.labelCategory2 || 'CYPHERSYSTEM.SkillCategoryTwo',
            SkillThree: actor.system.settings.skills.labelCategory3 || 'CYPHERSYSTEM.SkillCategoryThree',
            SkillFour:  actor.system.settings.skills.labelCategory4 || 'CYPHERSYSTEM.SkillCategoryFour',
        }

        for (const sorting of Object.keys(table)) {
            this.createList(parent, actor, tokenId, 'skill', sorting, table[sorting])
        }
    }

    _getAbilities(actor, tokenId, parent) {
        // up to four groups of abilities
        const table = {
            Ability:      actor.system.settings.abilities.labelCategory1 || 'CYPHERSYSTEM.Abilities',
            AbilityTwo:   actor.system.settings.abilities.labelCategory2 || 'CYPHERSYSTEM.AbilityCategoryTwo',
            AbilityThree: actor.system.settings.abilities.labelCategory3 || 'CYPHERSYSTEM.AbilityCategoryThree',
            AbilityFour:  actor.system.settings.abilities.labelCategory4 || 'CYPHERSYSTEM.AbilityCategoryFour',
            Spell:        'CYPHERSYSTEM.Spells'
        }

        for (const sorting of Object.keys(table)) {
            this.createList(parent, actor, tokenId, 'ability', sorting, table[sorting]);
        }
    }

}

/* ROLL HANDLER */

class MyRollHandler extends RollHandler {

    doHandleActionEvent(event, encodedValue) {
        let payload = encodedValue.split("|");
    
        if (payload.length != 4) {
          super.throwInvalidValueErr();
        }
    
        let macroType = payload[0];
        let actorId = payload[1];
        let tokenId = payload[2];
        let actionId = payload[3];
    
        let actor = Utils.getActor(actorId, tokenId);
    
        switch (macroType) {
          case 'pool':
            // might-roll | speed-roll | intellect-roll
            game.cyphersystem.rollEngineMain({actorUuid: actor.uuid, pool: actionId});
            break;
          case 'attack':
            // item-roll
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", false, "")
            break;
          case 'skill':
            // item-roll
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", false, "")
            break;
          case 'ability':
            // item-pay
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", true, "")
            break;
        }
    }
}

// Core Module Imports

export class MySystemManager extends SystemManager {
    /** @override */
    doGetCategoryManager () {
        return new CategoryManager()
    }

    /** @override */
    doGetActionHandler (categoryManager) {
        return new MyActionHandler(categoryManager)
    }

    /** @override */
    getAvailableRollHandlers () {
        const choices = { core: "Core Cypher System" };
        return choices
    }

    /** @override */
    doGetRollHandler (handlerId) {
        return new MyRollHandler()
    }

    /** @override */
    /*doRegisterSettings (updateFunc) {
        systemSettings.register(updateFunc)
    }*/

    async doRegisterDefaultFlags () {
        const DEFAULTS = {
            categories: [
                {
                    nestId: 'pools',
                    id: 'pools',
                    name: 'Pools',
                    type: 'system',
                    subcategories: [
                        {
                            nestId: 'pools_pools',
                            id: 'pools',
                            name: 'Pools',
                            type: 'system',
                            hasDerivedSubcategories: false
                        }
                    ]
                },
                {
                    nestId: 'skills',
                    id: 'skills',
                    name: 'Skills',
                    type: 'system',
                    subcategories: [
                        {
                            nestId: 'skills_skills',
                            id: 'skills',
                            name: 'Skills',
                            type: 'system'
                        }
                    ]
                },
                {
                    nestId: 'combat',
                    id: 'combat',
                    name: 'Combat',
                    type: 'system',
                    subcategories: [
                        {
                            nestId: 'combat_combat',
                            id: 'combat',
                            name: 'Combat',
                            type: 'system'
                        }
                    ]
                },
                {
                    nestId: 'abilities',
                    id: 'abilities',
                    name: 'Abilities',
                    type: 'system',
                    subcategories: [
                        {
                            nestId: 'abilities_abilities',
                            id: 'abilities',
                            name: 'Abilities',
                            type: 'system'
                        }
                    ]
                },
            ],
            subcategories: [
                { id: 'abilities', name: 'Abilities', type: 'system', hasDerivedSubcategories: true},
                { id: 'combat', name: 'Combat', type: 'system', hasDerivedSubcategories: false },
                { id: 'pools', name: 'Pools', type: 'system', hasDerivedSubcategories: false },
                { id: 'skills', name: 'Skills', type: 'system', hasDerivedSubcategories: true }
            ]
        }
        await Utils.setUserFlag('default', DEFAULTS)
    }
}

/* STARTING POINT */

Hooks.once('ready', async () => {
    const MODULE_ID = 'token-action-hud-cyphersystem';
    const REQUIRED_CORE_MODULE_VERSION = '1.1'
    const module = game.modules.get(MODULE_ID);
    module.api = {
        requiredCoreModuleVersion: REQUIRED_CORE_MODULE_VERSION,
        SystemManager: MySystemManager
    }    
    Hooks.call('tokenActionHudSystemReady', module)
});
