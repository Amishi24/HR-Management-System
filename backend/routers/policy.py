from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_session
from models import RotationPolicy, policy_scope
from schemas import RotationPolicyResponse, RotationPolicyCreateUpdate

router = APIRouter()

@router.get("/policy/rotation", response_model=List[RotationPolicyResponse])
def get_rotation_policies(db: Session = Depends(get_session)):
    policies = db.query(RotationPolicy).all()
    return policies

@router.post("/policy/rotation", response_model=RotationPolicyResponse, status_code=status.HTTP_201_CREATED)
def create_rotation_policy(
    policy_data: RotationPolicyCreateUpdate,
    db: Session = Depends(get_session)
):
    if policy_data.scope_type == policy_scope.GLOBAL:
        existing_global = db.query(RotationPolicy).filter(RotationPolicy.scope_type == policy_scope.GLOBAL).first()
        if existing_global:
            raise HTTPException(status_code=400, detail="A global rotation policy already exists.")
    
    new_policy = RotationPolicy(
        scope_type=policy_data.scope_type,
        scope_id=policy_data.scope_id,
        rules_config=policy_data.rules_config.dict()
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.patch("/policy/rotation/{policy_id}", response_model=RotationPolicyResponse)
def update_rotation_policy(
    policy_id: int,
    policy_data: RotationPolicyCreateUpdate, 
    db: Session = Depends(get_session)
):
    policy = db.query(RotationPolicy).filter(RotationPolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Rotation policy not found")

    update_data = policy_data.model_dump(exclude_unset=True)
    
    if update_data.get("scope_type") == policy_scope.GLOBAL:
        existing_global = db.query(RotationPolicy).filter(
            RotationPolicy.scope_type == policy_scope.GLOBAL,
            RotationPolicy.id != policy_id
        ).first()
        if existing_global:
            raise HTTPException(status_code=400, detail="A global rotation policy already exists.")

    for field, value in update_data.items():
        if field == "rules_config":
            # 1. Get the existing JSON from the database (or an empty dict if None)
            current_rules = policy.rules_config or {}
            
            # 2. Extract the new JSON from the Pydantic model
            new_rules = value if isinstance(value, dict) else value.model_dump(exclude_unset=True)
            
            # 3. Merge them together (new_rules will overwrite matching keys in current_rules)
            merged_rules = {**current_rules, **new_rules}
            
            # 4. Save the combined dictionary back to the model
            setattr(policy, field, merged_rules)
        else:
            setattr(policy, field, value)
    
    db.commit()
    db.refresh(policy)
    return policy