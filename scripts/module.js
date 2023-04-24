// FOR LIVE
import { ActionHandler, CategoryManager, RollHandler, SystemManager, Utils } from '../../token-action-hud-core/scripts/token-action-hud-core.min.js'

// For DEBUGGING
/*
import { ActionHandler   } from '../../token-action-hud-core/scripts/action-handlers/action-handler.js'
import { CategoryManager } from '../../token-action-hud-core/scripts/category-manager.js'
import { RollHandler     } from '../../token-action-hud-core/scripts/roll-handlers/roll-handler.js'
import { SystemManager   } from '../../token-action-hud-core/scripts/system-manager.js'
import { Utils           } from '../../token-action-hud-core/scripts/utilities/utils.js'
*/

const SKILLS_ID    = 'skills';
const POOLS_ID     = 'pools';
const ABILITIES_ID = 'abilities';
const COMBAT_ID    = 'combat';
const TAGS_ID      = 'tags';

const ACTION_POOL      = 'pool';
const ACTION_ABILITY   = 'ability';
const ACTION_SKILL     = 'skill';
const ACTION_ATTACK    = 'attack';
const ACTION_RECURSION = 'recursion';
const ACTION_TAG       = 'tag';

/* ACTIONS */

class MyActionHandler extends ActionHandler {
    constructor(categoryManager) {
        super(categoryManager);
    }

    /** @override */
    async buildSystemActions(subcategoryIds) {
        // We don't support MULTIPLE tokens being selected at the same time.
        //this.actors = (!this.actor) ? this._getActors() : [this.actor]
        //this.tokens = (!this.token) ? this._getTokens() : [this.token]
        //this.actorType = this.actor?.type

        const token = this.token;
        if (!token) return;
        const tokenId = token.id;
        const actor = this.actor;
        if (!actor) return;

        if (actor.type !== 'pc') {
          return;
        }
        this._getPools    (actor, tokenId, { id: POOLS_ID,     type: 'system' })
        this._getSkills   (actor, tokenId, { id: SKILLS_ID,    type: 'system' })
        this._getCombat   (actor, tokenId, { id: COMBAT_ID,    type: 'system' })
        this._getAbilities(actor, tokenId, { id: ABILITIES_ID, type: 'system' })
        this._getTags     (actor, tokenId, { id: TAGS_ID,      type: 'system' })
      
        //if (settings.get("showHudTitle")) result.hudTitle = token.name;
    }

    _getPools(actor, tokenId, parent) {
        // three entries in this list, one per pool.
        let actions = [ "might", "speed", "intellect" ].map( key => {
            return {
                id: key,
                name: game.i18n.localize(`CYPHERSYSTEM.${key.capitalize()}`),
                encodedValue: [ACTION_POOL, actor.id, tokenId, key.capitalize()].join(this.delimiter)
            }
        });
        /*
        // Can't roll from the ADDITIONAL POOL at the moment; but keep for later use
        if (actor.system.settings.general.additionalPool.active) {
            actions.push({
                id: 'additionalPool',
                name: actor.system.settings.general.additionalPool.label || game.i18n.localize(`CYPHERSYSTEM.AdditionalPool`),
                encodedValue: [ACTION_POOL, tokenId, "additional"].join(this.delimiter)
              });  
        }
        */
        this.addActionsToActionList(actions, parent);
    }

    _getCombat(actor, tokenId, parent) {
        // just one long list of actions for the combat category
        const actions = actor.items.filter( item => item.type === 'attack' &&
            (!actor.system.settings.general.hideArchive || !item.system.archived)).map( item => { return {
            id: item.id,
            name: item.name,
            encodedValue: [ACTION_ATTACK, actor.id, tokenId, item.id].join(this.delimiter),
            img: Utils.getImage(item)
        }})
        this.addActionsToActionList(actions, parent);
    }

    createList(parent, actor, tokenId, itemtype, checksort, sorting, label, selectedfunc=undefined) {
        // create one sublist
        const actions = actor.items.filter( item => item.type === itemtype && 
            (!checksort || item.system.settings.general.sorting === sorting) &&
            (!actor.system.settings.general.hideArchive || !item.system.archived))
            .map(item => {
            return {
                id: item.id,
                name: item.name,
                encodedValue: [itemtype, actor.id, tokenId, item.id].join(this.delimiter),
                cssClass: item.system.archived ? 'disabled' : selectedfunc ? (selectedfunc(item) ? 'toggle active' : 'toggle') : '',
                img: Utils.getImage(item)
            }
        })
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
        for (const [ sorting, label ] of Object.entries(table)) {
            this.createList(parent, actor, tokenId, ACTION_SKILL, true, sorting, label)
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
        for (const [ sorting, label ] of Object.entries(table)) {
            this.createList(parent, actor, tokenId, ACTION_ABILITY, true, sorting, label);
        }
    }

    _getTags(actor, tokenId, parent) {
        // current recursion is from actor.getFlag("cyphersystem", "recursion"), but the stored string is @<lowercasenanme>
        const recursion = actor.getFlag("cyphersystem", "recursion")?.slice(1); // strip leading '@'
        const recursionname = actor.items.find(item => item.name.toLowerCase() === recursion)?.name;
        this.createList(parent, actor, tokenId, ACTION_RECURSION, false, 'recursion', 'CYPHERSYSTEM.Recursions', 
            (item) => item.name == recursionname );
        this.createList(parent, actor, tokenId, ACTION_TAG, false, 'tag', 'CYPHERSYSTEM.Tags',
            (item) => item.system.active );
    }
}


/* ROLL HANDLER */

class MyRollHandler extends RollHandler {

    doHandleActionEvent(event, encodedValue) {
        let payload = encodedValue.split("|");
    
        if (payload.length != 4) {
          super.throwInvalidValueErr();
        }
    
        const macroType = payload[0];
        const actorId  = payload[1];
        const tokenId  = payload[2];
        const actionId = payload[3];

        const actor = Utils.getActor(actorId, tokenId);
        if (this.isRenderItem()) {
            // Nothing to display for action pools
            if (macroType != ACTION_POOL) this.doRenderItem(actor, actionId)
            return;
        }
            
        switch (macroType) {
          case ACTION_POOL:
            // might-roll | speed-roll | intellect-roll
            game.cyphersystem.rollEngineMain({actorUuid: actor.uuid, pool: actionId});
            break;
          case ACTION_ATTACK:
            // item-roll
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", false, "")
            break;
          case ACTION_SKILL:
            // item-roll
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", false, "")
            break;
          case ACTION_ABILITY:
            // item-pay
            game.cyphersystem.itemRollMacro(actor, actionId, "", "", "", "", "", "", "", "", "", "", "", "", true, "")
            break;
          case ACTION_RECURSION:
            // transition to a recursion
            game.cyphersystem.recursionMacro(actor, Utils.getItem(actor,  actionId)).then(() => Hooks.callAll('forceUpdateTokenActionHud'))
            break;
          case ACTION_TAG:
            // toggle the state of a tag
            game.cyphersystem.tagMacro(actor, Utils.getItem(actor,  actionId)).then(() => Hooks.callAll('forceUpdateTokenActionHud'))
            break;
        }

        // Ensure the HUD reflects the new conditions
        Hooks.callAll('forceUpdateTokenActionHud');
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

        const SKILLS_NAME    = game.i18n.localize('CYPHERSYSTEM.Skills');
        const ABILITIES_NAME = game.i18n.localize('CYPHERSYSTEM.Abilities');
        const POOLS_NAME     = game.i18n.localize('CYPHERSYSTEM.Pool');
        const COMBAT_NAME    = game.i18n.localize('CYPHERSYSTEM.Combat');
        const TAGS_NAME      = '@'; //game.i18n.localize('CYPHERSYSTEM.Tags');
        
        const DEFAULTS = {
            categories: [
                {
                    nestId: POOLS_ID,
                    id:     POOLS_ID,
                    name:   POOLS_NAME,
                    type:   'system',
                    subcategories: [
                        {
                            nestId: 'pools_pools',
                            id:     POOLS_ID,
                            name:   POOLS_NAME,
                            type:   'system',
                            hasDerivedSubcategories: false
                        }
                    ]
                },
                {
                    nestId: SKILLS_ID,
                    id:     SKILLS_ID,
                    name:   SKILLS_NAME,
                    type:   'system',
                    subcategories: [
                        {
                            nestId: 'skills_skills',
                            id:     SKILLS_ID,
                            name:   SKILLS_NAME,
                            type:   'system'
                        }
                    ]
                },
                {
                    nestId: COMBAT_ID,
                    id:     COMBAT_ID,
                    name:   COMBAT_NAME,
                    type:   'system',
                    subcategories: [
                        {
                            nestId: 'combat_combat',
                            id:     COMBAT_ID,
                            name:   COMBAT_NAME,
                            type: 'system'
                        }
                    ]
                },
                {
                    nestId: ABILITIES_ID,
                    id:     ABILITIES_ID,
                    name:   ABILITIES_NAME,
                    type:   'system',
                    subcategories: [
                        {
                            nestId: 'abilities_abilities',
                            id:     ABILITIES_ID,
                            name:   ABILITIES_NAME,
                            type:   'system'
                        }
                    ]
                },
                {
                    nestId: TAGS_ID,
                    id:     TAGS_ID,
                    name:   TAGS_NAME,
                    type:   'system',
                    subcategories: [
                        {
                            nestId: 'tags_tags',
                            id:     TAGS_ID,
                            name:   TAGS_NAME,
                            type:   'system'
                        }
                    ]
                },
            ],
            subcategories: [
                { id: ABILITIES_ID, name: ABILITIES_NAME, type: 'system', hasDerivedSubcategories: true  },
                { id: COMBAT_ID,    name: COMBAT_NAME,    type: 'system', hasDerivedSubcategories: false },
                { id: POOLS_ID,     name: POOLS_NAME,     type: 'system', hasDerivedSubcategories: false },
                { id: SKILLS_ID,    name: SKILLS_NAME,    type: 'system', hasDerivedSubcategories: true  },
                { id: TAGS_ID,      name: TAGS_NAME,      type: 'system', hasDerivedSubcategories: true  }
            ]
        }

        // HUD CORE v1.2 wants us to return the DEFAULTS
        return DEFAULTS;
    }
}

/* STARTING POINT */

Hooks.once('tokenActionHudCoreApiReady', async () => {
    const module = game.modules.get('token-action-hud-cyphersystem');
    module.api = {
        requiredCoreModuleVersion: '1.3',
        SystemManager: MySystemManager
    }    
    Hooks.call('tokenActionHudSystemReady', module)
});
